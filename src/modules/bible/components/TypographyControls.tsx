"use client"

import { useState, useEffect } from "react"

type TypographySettings = {
  fontSize: number
  lineSpacing: number
  columnWidth: "narrow" | "comfortable" | "wide"
}

const COLUMN_WIDTHS = { narrow: "max-w-xl", comfortable: "max-w-2xl", wide: "max-w-4xl" }

export function TypographyControls() {
  const [settings, setSettings] = useState<TypographySettings>({
    fontSize: 16,
    lineSpacing: 1.6,
    columnWidth: "comfortable",
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("biblehub-typography")
    if (saved) {
      try { setSettings(JSON.parse(saved)) } catch {}
    }
  }, [])

  function update(key: keyof TypographySettings, value: number | string) {
    const next = { ...settings, [key]: value }
    setSettings(next)
    localStorage.setItem("biblehub-typography", JSON.stringify(next))
    document.documentElement.style.setProperty("--reader-font-size", `${next.fontSize}px`)
    document.documentElement.style.setProperty("--reader-line-height", String(next.lineSpacing))
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="rounded-lg border px-3 py-1 text-sm">
        Display
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border bg-background p-4 shadow-lg">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Font Size: {settings.fontSize}px</label>
              <input type="range" min={12} max={24} value={settings.fontSize} onChange={(e) => update("fontSize", parseInt(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Line Spacing: {settings.lineSpacing}</label>
              <input type="range" min={1.2} max={2.0} step={0.1} value={settings.lineSpacing} onChange={(e) => update("lineSpacing", parseFloat(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Column Width</label>
              <select value={settings.columnWidth} onChange={(e) => update("columnWidth", e.target.value)} className="w-full rounded-lg border px-2 py-1 text-sm">
                <option value="narrow">Narrow</option>
                <option value="comfortable">Comfortable</option>
                <option value="wide">Wide</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
