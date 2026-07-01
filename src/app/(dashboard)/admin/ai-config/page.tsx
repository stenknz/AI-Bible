"use client"

import { useState, useEffect } from "react"

type ModelConfig = {
  id: string
  taskType: string
  provider: string
  model: string
  temperature: number
  maxTokens: number
  isActive: boolean
}

const DEFAULT_TASKS = [
  { taskType: "verse_explanation", provider: "opencode-zen", model: "default", temperature: 0.3, maxTokens: 500 },
  { taskType: "passage_summary", provider: "opencode-zen", model: "default", temperature: 0.3, maxTokens: 800 },
  { taskType: "theological_question_answering", provider: "opencode-zen", model: "default", temperature: 0.4, maxTokens: 1000 },
  { taskType: "devotional_generation", provider: "opencode-zen", model: "default", temperature: 0.7, maxTokens: 800 },
  { taskType: "study_plan_generation", provider: "opencode-zen", model: "default", temperature: 0.5, maxTokens: 1000 },
]

export default function AIConfigPage() {
  const [configs, setConfigs] = useState<ModelConfig[]>([])
  const [editing, setEditing] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/ai-config").then((r) => r.json()).then(setConfigs)
  }, [])

  async function saveConfig(config: Partial<ModelConfig>) {
    const res = await fetch("/api/admin/ai-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    })
    if (res.ok) {
      const updated = await res.json()
      setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setEditing(null)
    }
  }

  const allTasks = [...DEFAULT_TASKS.map((t) => t.taskType)]
  const existingTypes = new Set(configs.map((c) => c.taskType))
  const missingTasks = allTasks.filter((t) => !existingTypes.has(t))

  return (
    <div className="max-w-3xl">
      <h2 className="mb-4 text-lg font-medium">AI Model Configuration</h2>

      <div className="space-y-3">
        {configs.map((config) => (
          <div key={config.id} className="rounded-lg border p-4">
            {editing === config.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="text-xs text-muted-foreground">Provider</label>
                    <input defaultValue={config.provider} id="provider" className="w-full rounded border px-2 py-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Model</label>
                    <input defaultValue={config.model} id="model" className="w-full rounded border px-2 py-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Temperature</label>
                    <input type="number" step="0.1" defaultValue={config.temperature} id="temperature" className="w-full rounded border px-2 py-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Tokens</label>
                    <input type="number" defaultValue={config.maxTokens} id="maxTokens" className="w-full rounded border px-2 py-1" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const form = document.getElementById(`form-${config.id}`)
                    const provider = (form?.querySelector("#provider") as HTMLInputElement)?.value
                    const model = (form?.querySelector("#model") as HTMLInputElement)?.value
                    const temperature = parseFloat((form?.querySelector("#temperature") as HTMLInputElement)?.value)
                    const maxTokens = parseInt((form?.querySelector("#maxTokens") as HTMLInputElement)?.value)
                    saveConfig({ id: config.id, taskType: config.taskType, provider, model, temperature, maxTokens, isActive: config.isActive })
                  }} className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
                    Save
                  </button>
                  <button onClick={() => setEditing(null)} className="rounded border px-3 py-1 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{config.taskType.replace(/_/g, " ")}</p>
                  <p className="text-sm text-muted-foreground">{config.provider}/{config.model} — temp: {config.temperature} — max: {config.maxTokens}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${config.isActive ? "bg-green-500" : "bg-red-500"}`} />
                  <button onClick={() => setEditing(config.id)} className="text-sm text-blue-600 hover:underline">Edit</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {missingTasks.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm text-muted-foreground">Missing task configurations:</p>
          <div className="flex flex-wrap gap-2">
            {missingTasks.map((task) => (
              <button
                key={task}
                onClick={async () => {
                  const res = await fetch("/api/admin/ai-config", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(DEFAULT_TASKS.find((t) => t.taskType === task)),
                  })
                  if (res.ok) {
                    const config = await res.json()
                    setConfigs((prev) => [...prev, config])
                  }
                }}
                className="rounded-lg border px-3 py-1 text-xs hover:bg-muted"
              >
                Add {task.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
