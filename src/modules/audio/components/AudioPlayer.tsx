"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { AudioRecordingData, PlaybackStateData } from "@/modules/audio/types/audio"

type Props = {
  recording: AudioRecordingData
}

export function AudioPlayer({ recording }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playback, setPlayback] = useState<PlaybackStateData>({
    id: "",
    recordingId: recording.id,
    position: 0,
    speed: 1.0,
    volume: 1.0,
    isPlaying: false,
  })

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (playback.isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlayback((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
  }, [playback.isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      setPlayback((prev) => ({ ...prev, position: Math.floor(audio.currentTime) }))
    }
    const onEnded = () => {
      setPlayback((prev) => ({ ...prev, isPlaying: false, position: 0 }))
    }

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("ended", onEnded)
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("ended", onEnded)
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playback.speed
      audioRef.current.volume = playback.volume
    }
  }, [playback.speed, playback.volume])

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <audio ref={audioRef} src={recording.url} preload="metadata" />

      <button onClick={togglePlay} className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700">
        {playback.isPlaying ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
        )}
      </button>

      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(playback.position)}</span>
          <span>{formatTime(recording.duration)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={recording.duration}
          value={playback.position}
          onChange={(e) => {
            const pos = parseInt(e.target.value)
            if (audioRef.current) audioRef.current.currentTime = pos
            setPlayback((prev) => ({ ...prev, position: pos }))
          }}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <select
          value={playback.speed}
          onChange={(e) => setPlayback((prev) => ({ ...prev, speed: parseFloat(e.target.value) }))}
          className="rounded border px-2 py-1 text-xs"
        >
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </div>
    </div>
  )
}
