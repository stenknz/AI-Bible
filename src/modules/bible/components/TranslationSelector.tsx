"use client"

import { useState, useEffect } from "react"

type Translation = { id: string; code: string; name: string; isDefault: boolean }

type Props = {
  current: string
  onChange: (code: string) => void
}

export default function TranslationSelector({ current, onChange }: Props) {
  const [translations, setTranslations] = useState<Translation[]>([])

  useEffect(() => {
    fetch("/api/bible/translations")
      .then((r) => r.json())
      .then(setTranslations)
      .catch(() => console.error("Failed to load translations"))
  }, [])

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-all cursor-pointer focus:ring-2 focus:ring-secondary/20 focus:border-secondary appearance-none"
    >
      {translations.map((t) => (
        <option key={t.code} value={t.code}>{t.name}</option>
      ))}
    </select>
  )
}
