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