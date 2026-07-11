import { GoogleGenAI } from '@google/genai'

const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'

function getGeminiClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY in your environment.')
  }

  return new GoogleGenAI({ apiKey })
}

export async function generateGeminiText(prompt: string) {
  const trimmedPrompt = prompt.trim()

  if (!trimmedPrompt) {
    throw new Error('Enter a prompt before sending it to Gemini.')
  }

  const ai = getGeminiClient()
  const response = await ai.models.generateContent({
    model,
    contents: trimmedPrompt,
  })

  return response.text || 'Gemini returned no text.'
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
}
