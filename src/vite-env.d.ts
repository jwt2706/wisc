/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_GEMINI_MODEL?: string
  readonly ELEVENLABS_API_KEY?: string
  readonly ELEVENLABS_MODEL_ID?: string
  readonly ELEVENLABS_OUTPUT_FORMAT?: string
  readonly ELEVENLABS_VOICE_NARRATOR?: string
  readonly ELEVENLABS_VOICE_HERO?: string
  readonly ELEVENLABS_VOICE_SKEPTIC?: string
  readonly ELEVENLABS_VOICE_WILD?: string
  readonly ELEVENLABS_VOICE_CALM?: string
  readonly ELEVENLABS_VOICE_VILLAIN?: string
  readonly ELEVENLABS_VOICE_WHISPER?: string
  readonly ELEVENLABS_VOICE_COMIC?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}