import { GoogleGenAI } from '@google/genai'

// Models to try, in order. If one comes back rate-limited (HTTP 429),
// we fall through to the next one.
const MODEL_FALLBACK_CHAIN = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemma-4-26b-it',
  'gemma-4-31b-it',
]

// If VITE_GEMINI_MODEL is set, try it FIRST, then still fall through to the
// rest of the chain on a rate limit (it used to fully replace the chain,
// which meant setting that env var silently disabled fallback entirely).
const envModel = import.meta.env.VITE_GEMINI_MODEL as string | undefined
const models = envModel
  ? [envModel, ...MODEL_FALLBACK_CHAIN.filter((m) => m !== envModel)]
  : MODEL_FALLBACK_CHAIN

function getGeminiClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY in your environment.')
  }

  return new GoogleGenAI({ apiKey })
}

function isRateLimitError(err: unknown) {
  const anyErr = err as any
  // @google/genai's ApiError puts the HTTP status code on `.status` (a
  // number) and the raw JSON error body on `.message`. Check every field
  // that could plausibly carry the 429, since exact shape has changed
  // across SDK versions.
  const candidates = [
    anyErr?.status,
    anyErr?.code,
    anyErr?.response?.status,
    anyErr?.error?.code,
    anyErr?.error?.status,
  ]
  const message = String(anyErr?.message ?? anyErr ?? '')

  return (
    candidates.some((c) => c === 429 || c === '429') ||
    candidates.some((c) => typeof c === 'string' && /resource_exhausted/i.test(c)) ||
    /429|rate.?limit|resource.?exhausted|quota/i.test(message)
  )
}

/**
 * Runs `attempt` against each model in `models`, in order, moving on to the
 * next one whenever the current one reports a rate limit. Any non-rate-limit
 * error is thrown immediately. If every model is rate limited, throws the
 * final "you got rate limited lol" error.
 */
async function withModelFallback<T>(
  attempt: (model: string) => Promise<T>
): Promise<T> {
  let lastError: unknown

  for (const model of models) {
    console.debug(`[gemini] trying model "${model}"...`)
    try {
      return await attempt(model)
    } catch (err) {
      if (!isRateLimitError(err)) {
        console.error(`[gemini] "${model}" failed with a non-rate-limit error, not falling back`, err)
        throw err
      }
      lastError = err
      console.warn(`[gemini] "${model}" is rate limited, trying next model...`, err)
    }
  }

  console.error('[gemini] all models rate limited', lastError)
  throw new Error('you got rate limited lol look at this chud')
}

export async function generateGeminiText(prompt: string) {
  const trimmedPrompt = prompt.trim()

  if (!trimmedPrompt) {
    throw new Error('Enter a prompt before sending it to Gemini.')
  }

  const ai = getGeminiClient()

  return withModelFallback(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: trimmedPrompt,
    })

    return response.text || 'Gemini returned no text.'
  })
}

function stripJsonFence(raw: string) {
  return raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/, '')
    .trim()
}

/**
 * Same as generateGeminiText, but asks Gemini to reply with raw JSON only and
 * parses the result. Used for structured decisions like AI votes, where we
 * need a specific shape back rather than free text.
 */
export async function generateGeminiJSON<T>(prompt: string): Promise<T> {
  const trimmedPrompt = prompt.trim()

  if (!trimmedPrompt) {
    throw new Error('Enter a prompt before sending it to Gemini.')
  }

  const ai = getGeminiClient()

  return withModelFallback(async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: `${trimmedPrompt}\n\nRespond with ONLY valid JSON matching the requested shape. No markdown fences, no commentary, no extra keys.`,
    })

    const raw = response.text || ''
    const cleaned = stripJsonFence(raw)

    if (!cleaned) {
      throw new Error('Gemini returned no JSON.')
    }

    try {
      return JSON.parse(cleaned) as T
    } catch {
      throw new Error(`Gemini returned unparsable JSON: ${cleaned}`)
    }
  })
}
