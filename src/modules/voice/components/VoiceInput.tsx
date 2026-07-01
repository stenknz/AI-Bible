"use client"

import { useState, useCallback, useRef } from "react"
import { getSpeechRecognizer } from "@/modules/voice/services/speech-recognizer"

type Props = {
  onResult?: (transcript: string) => void
  onCommand?: (action: string, params: Record<string, string>) => void
}

export function VoiceInput({ onResult, onCommand }: Props) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [supported, setSupported] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  const toggleListening = useCallback(async () => {
    if (listening) {
      abortRef.current?.abort()
      setListening(false)
      return
    }

    const recognizer = getSpeechRecognizer()
    if (!recognizer.isAvailable()) {
      setSupported(false)
      return
    }

    setListening(true)
    setTranscript("")
    abortRef.current = new AbortController()

    try {
      for await (const result of recognizer.listen({ interimResults: true, continuous: false })) {
        if (abortRef.current?.signal.aborted) break
        setTranscript(result.transcript)
        if (result.isFinal) {
          if (result.command) {
            onCommand?.(result.command.action, result.command.parameters)
          } else {
            onResult?.(result.transcript)
          }
        }
      }
    } catch (err) {
      console.error("Speech recognition error:", err)
    } finally {
      setListening(false)
    }
  }, [listening, onResult, onCommand])

  if (!supported) {
    return (
      <div className="rounded-lg border p-3 text-center text-sm text-muted-foreground">
        Speech recognition is not available in this browser.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={toggleListening}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
          listening ? "bg-red-500 text-white animate-pulse" : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        title={listening ? "Stop listening" : "Start voice input"}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
      {listening && <p className="text-xs text-blue-500 animate-pulse">Listening...</p>}
      {transcript && (
        <p className="rounded-lg bg-muted p-2 text-sm max-w-md text-center">{transcript}</p>
      )}
    </div>
  )
}
