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
    <div>
      <h2 className="mb-4 text-lg font-medium">Feature Toggles</h2>
      <div className="space-y-2">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">{t.key}</p>
              {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
            </div>
            <button
              onClick={() => toggle(t.key, !t.enabled)}
              className={`rounded-lg px-3 py-1 text-sm ${t.enabled ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}
            >
              {t.enabled ? "ON" : "OFF"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
