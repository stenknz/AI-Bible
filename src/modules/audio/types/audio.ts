export type TTSOptions = {
  voice: string
  speed: number
  format: "mp3" | "ogg" | "wav"
}

export type TTSVoice = {
  id: string
  name: string
  language: string
  gender: "male" | "female" | "neutral"
}

export interface TTSProvider {
  synthesize(text: string, options?: TTSOptions): Promise<ArrayBuffer>
  getVoices(): Promise<TTSVoice[]>
  supportsStreaming: boolean
}

export type ListenOptions = {
  continuous?: boolean
  interimResults?: boolean
  language?: string
}

export type RecognitionResult = {
  transcript: string
  confidence: number
  isFinal: boolean
  command?: VoiceCommand
}

export type VoiceCommand = {
  action: "search" | "navigate" | "note" | "pray"
  parameters: Record<string, string>
}

export interface SpeechRecognizer {
  listen(options?: ListenOptions): AsyncIterable<RecognitionResult>
  transcribe(audio: ArrayBuffer): Promise<string>
  isAvailable(): boolean
}

export type AudioRecordingData = {
  id: string
  entityId: string
  entityType: "chapter" | "verse"
  url: string
  duration: number
  format: string
  narrator: string | null
}

export type PlaybackStateData = {
  id: string
  recordingId: string
  position: number
  speed: number
  volume: number
  isPlaying: boolean
}
