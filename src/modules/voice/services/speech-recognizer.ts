import type { SpeechRecognizer, ListenOptions, RecognitionResult } from "@/modules/audio/types/audio"

class BrowserSpeechRecognizer implements SpeechRecognizer {
  private recognition: any = null

  isAvailable(): boolean {
    return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  }

  listen(options: ListenOptions = {}): AsyncIterable<RecognitionResult> {
    if (!this.isAvailable()) {
      throw new Error("Speech recognition is not available in this browser")
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    this.recognition = new SpeechRecognition()
    this.recognition.continuous = options.continuous ?? false
    this.recognition.interimResults = options.interimResults ?? true
    this.recognition.lang = options.language ?? "en-US"

    const pending: Array<RecognitionResult> = []
    let resolve: (() => void) | null = null

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript.toLowerCase()
        const command = parseCommand(transcript)
        pending.push({
          transcript: result[0].transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal,
          command,
        })
      }
      if (resolve) {
        resolve()
        resolve = null
      }
    }

    this.recognition.start()

    return {
      [Symbol.asyncIterator]: () => ({
        next: async (): Promise<IteratorResult<RecognitionResult>> => {
          while (pending.length === 0) {
            await new Promise<void>((r) => { resolve = r })
          }
          return { value: pending.shift()!, done: false }
        },
      }),
    }
  }

  async transcribe(audio: ArrayBuffer): Promise<string> {
    throw new Error("Transcription from ArrayBuffer not implemented in browser. Use listen() for live recognition.")
  }
}

function parseCommand(transcript: string): { action: "search" | "navigate" | "note" | "pray"; parameters: Record<string, string> } | undefined {
  if (transcript.startsWith("search ")) {
    return { action: "search", parameters: { query: transcript.slice(7) } }
  }
  if (transcript.startsWith("go to ")) {
    return { action: "navigate", parameters: { location: transcript.slice(6) } }
  }
  if (transcript.startsWith("note ")) {
    return { action: "note", parameters: { text: transcript.slice(5) } }
  }
  if (transcript.startsWith("pray ")) {
    return { action: "pray", parameters: { text: transcript.slice(5) } }
  }
  return undefined
}

let instance: BrowserSpeechRecognizer | null = null

export function getSpeechRecognizer(): SpeechRecognizer {
  if (!instance) {
    instance = new BrowserSpeechRecognizer()
  }
  return instance
}
