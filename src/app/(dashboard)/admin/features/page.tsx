"use client"

import { useState, useEffect } from "react"

type FeatureToggle = { key: string; enabled: boolean; description: string | null }

export default function FeaturesPage() {
  const [toggles, setToggles] = useState<FeatureToggle[]>([])

  useEffect(() => {
    fetch("/api/admin/feature-toggles").then((r) => r.json()).then(setToggles)
  }, [])

  async function toggle(key: string, enabled: boolean) {
    const res = await fetch("/api/admin/feature-toggles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    })
    if (res.ok) {
      setToggles((prev) => prev.map((t) => (t.key === key ? { ...t, enabled } : t)))
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 text-lg font-medium text-foreground">Feature Toggles</h2>
      <div className="space-y-3">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between rounded-xl bg-card p-5 shadow-sm">
            <div className="flex-1">
              <p className="font-medium text-foreground">{t.key}</p>
              {t.description && <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>}
            </div>
            <button
              onClick={() => toggle(t.key, !t.enabled)}
              className={`ml-4 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${t.enabled ? "bg-secondary text-white" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}
            >
              {t.enabled ? "ON" : "OFF"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
