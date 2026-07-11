import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const elevenLabsCharacterTypes = [
  'voice_1',
  'voice_2',
  'voice_3',
  'voice_4',
  'voice_5',
  'voice_6',
  'voice_7',
  'voice_8',
] as const

export type ElevenLabsCharacterType = (typeof elevenLabsCharacterTypes)[number]

export type ElevenLabsDialogueLine = {
  characterType: ElevenLabsCharacterType
  text: string
}

type CharacterVoiceProfile = {
  label: string
  envKey: keyof ImportMetaEnv
  styleHint: string
}

const defaultModelId =
  import.meta.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2'

const defaultOutputFormat =
  import.meta.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128'

const characterVoiceProfiles: Record<ElevenLabsCharacterType, CharacterVoiceProfile> = {
  voice_1: {
    label: 'voice_1',
    envKey: 'ELEVENLABS_VOICE_1',
    styleHint: 'steady, cinematic, and readable',
  },
  voice_2: {
    label: 'voice_2',
    envKey: 'ELEVENLABS_VOICE_2',
    styleHint: 'warm, clear, and confident',
  },
  voice_3: {
    label: 'voice_3',
    envKey: 'ELEVENLABS_VOICE_3',
    styleHint: 'dry, precise, and a little voice_3al',
  },
  voice_4: {
    label: 'voice_4 Card',
    envKey: 'ELEVENLABS_VOICE_4',
    styleHint: 'fast, bright, and unpredictable',
  },
  voice_5: {
    label: 'voice_5',
    envKey: 'ELEVENLABS_VOICE_5',
    styleHint: 'low, relaxed, and grounded',
  },
  voice_6: {
    label: 'voice_6',
    envKey: 'ELEVENLABS_VOICE_6',
    styleHint: 'smooth, unsettling, and controlled',
  },
  voice_7: {
    label: 'voice_7',
    envKey: 'ELEVENLABS_VOICE_7',
    styleHint: 'soft, secretive, and intimate',
  },
  voice_8: {
    label: 'voice_8',
    envKey: 'ELEVENLABS_VOICE_8',
    styleHint: 'playful, light, and a touch chaotic',
  },
}

function getElevenLabsClient() {
  const apiKey = import.meta.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    throw new Error('Missing ELEVENLABS_API_KEY in your environment.')
  }

  return new ElevenLabsClient({ apiKey })
}

function getVoiceIdForCharacter(characterType: ElevenLabsCharacterType) {
  const profile = characterVoiceProfiles[characterType]
  const voiceId = import.meta.env[profile.envKey]

  if (!voiceId) {
    throw new Error(
      `Missing ${profile.envKey} for the ${profile.label.toLowerCase()} character voice.`,
    )
  }

  return voiceId
}

export function getElevenLabsCharacterProfiles() {
  return elevenLabsCharacterTypes.map((characterType) => {
    const profile = characterVoiceProfiles[characterType]

    return {
      characterType,
      label: profile.label,
      styleHint: profile.styleHint,
      voiceId: import.meta.env[profile.envKey] || '',
      isConfigured: Boolean(import.meta.env[profile.envKey]),
    }
  })
}

export async function generateElevenLabsDubbingAudio(
  dialogueLines: ElevenLabsDialogueLine[],
  options?: {
    modelId?: string
    outputFormat?: string
    seed?: number
  },
) {
  if (!dialogueLines.length) {
    throw new Error('Add at least one dialogue line before generating audio.')
  }

  const client = getElevenLabsClient()
  const inputs = dialogueLines.map((line) => ({
    text: line.text.trim(),
    voiceId: getVoiceIdForCharacter(line.characterType),
  }))

  const response = await client.textToDialogue.convert({
    inputs,
    modelId: options?.modelId || defaultModelId,
    outputFormat: options?.outputFormat || defaultOutputFormat,
    seed: options?.seed,
    enableLogging: true,
  })

  return new Response(response).blob()
}

export async function createElevenLabsDubbingUrl(
  dialogueLines: ElevenLabsDialogueLine[],
  options?: {
    modelId?: string
    outputFormat?: string
    seed?: number
  },
) {
  const audioBlob = await generateElevenLabsDubbingAudio(dialogueLines, options)
  return URL.createObjectURL(audioBlob)
}