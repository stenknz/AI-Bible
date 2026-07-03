import { VoiceCommandPalette } from "@/modules/voice/components/VoiceCommandPalette"

export default function VoicePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-foreground">Voice Commands</h1>

      <div className="rounded-xl bg-card p-8 shadow-sm">
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Use your voice to search the Bible, navigate, create notes, and more.
        </p>
        <div className="flex justify-center">
          <VoiceCommandPalette />
        </div>
      </div>
    </div>
  )
}
