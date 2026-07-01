import { VoiceCommandPalette } from "@/modules/voice/components/VoiceCommandPalette"

export default function VoicePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Voice Commands</h1>

      <div className="rounded-lg border p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Use your voice to search the Bible, navigate, create notes, and more.
        </p>
        <div className="flex justify-center">
          <VoiceCommandPalette />
        </div>
      </div>
    </div>
  )
}
