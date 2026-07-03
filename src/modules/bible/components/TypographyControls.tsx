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
      <button onClick={() => setOpen(!open)} className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground font-medium hover:bg-muted transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block mr-1.5 -mt-0.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
        Display
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-card p-5 shadow-xl animate-fade-in">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground/60 font-medium">Font Size: {settings.fontSize}px</label>
              <input type="range" min={12} max={24} value={settings.fontSize} onChange={(e) => update("fontSize", parseInt(e.target.value))} className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-secondary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground/60 font-medium">Line Spacing: {settings.lineSpacing}</label>
              <input type="range" min={1.2} max={2.0} step={0.1} value={settings.lineSpacing} onChange={(e) => update("lineSpacing", parseFloat(e.target.value))} className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-secondary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground/60 font-medium">Column Width</label>
              <select value={settings.columnWidth} onChange={(e) => update("columnWidth", e.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground cursor-pointer focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all appearance-none">
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
