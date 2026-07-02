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
      .catch(() => {})
  }, [])

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border px-2 py-1 text-xs"
    >
      {translations.map((t) => (
        <option key={t.code} value={t.code}>{t.name}</option>
      ))}
    </select>
  )
}
