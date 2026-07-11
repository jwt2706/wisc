import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionResultLike = {
  transcript: string
}

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  const globalWindow = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }

  return globalWindow.SpeechRecognition || globalWindow.webkitSpeechRecognition || null
}

/**
 * Wraps the browser's SpeechRecognition API so the human player can speak
 * their discussion turn instead of typing it. Falls back gracefully (via
 * isSupported) on browsers without speech recognition, so the UI can offer a
 * text fallback.
 */
export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionConstructor()))
  }, [])

  const startListening = useCallback(() => {
    const RecognitionConstructor = getSpeechRecognitionConstructor()

    if (!RecognitionConstructor) {
      setIsSupported(false)
      return
    }

    setTranscript('')

    const recognition = new RecognitionConstructor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let combined = ''

      for (let index = 0; index < event.results.length; index += 1) {
        combined += event.results[index][0]?.transcript || ''
      }

      setTranscript(combined.trim())
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return { isListening, transcript, isSupported, startListening, stopListening }
}
