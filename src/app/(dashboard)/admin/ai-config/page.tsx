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
  apiKeyEncrypted: string | null
}

const GLOBAL_TASK = "__global__"

const DEFAULT_TASKS = [
  { taskType: "verse_explanation", provider: "opencode-go", model: "deepseek-v4-flash", temperature: 0.3, maxTokens: 8000 },
  { taskType: "passage_summary", provider: "opencode-go", model: "deepseek-v4-flash", temperature: 0.3, maxTokens: 8000 },
  { taskType: "theological_question_answering", provider: "opencode-go", model: "deepseek-v4-flash", temperature: 0.4, maxTokens: 8000 },
  { taskType: "devotional_generation", provider: "opencode-go", model: "deepseek-v4-flash", temperature: 0.7, maxTokens: 8000 },
  { taskType: "study_plan_generation", provider: "opencode-go", model: "deepseek-v4-flash", temperature: 0.5, maxTokens: 8000 },
  { taskType: "cross_reference_generation", provider: "opencode-go", model: "deepseek-v4-flash", temperature: 0.2, maxTokens: 8000 },
  { taskType: "quiz_generation", provider: "opencode-go", model: "deepseek-v4-flash", temperature: 0.6, maxTokens: 8000 },
]

const TASK_LABELS: Record<string, string> = {
  __global__: "Global (shared API key + default model)",
  verse_explanation: "Verse Explanation",
  passage_summary: "Passage Summary",
  theological_question_answering: "Theological Q&A",
  cross_reference_generation: "Cross Reference Generation",
  devotional_generation: "Devotional Generation",
  study_plan_generation: "Study Plan Generation",
  quiz_generation: "Quiz Generation",
}

export default function AIConfigPage() {
  const [configs, setConfigs] = useState<ModelConfig[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [globalApiKey, setGlobalApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)

  const globalConfig = configs.find((c) => c.taskType === GLOBAL_TASK)
  const taskConfigs = configs.filter((c) => c.taskType !== GLOBAL_TASK)

  useEffect(() => {
    fetch("/api/admin/ai-config").then((r) => r.json()).then((data: ModelConfig[]) => {
      setConfigs(data)
      const global = data.find((c) => c.taskType === GLOBAL_TASK)
      if (global?.apiKeyEncrypted) setGlobalApiKey("")
    })
  }, [])

  async function saveGlobal() {
    setSaving(true)
    const res = await fetch("/api/admin/ai-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskType: GLOBAL_TASK,
        provider: "opencode-go",
        model: (document.getElementById("global-model") as HTMLInputElement)?.value || "deepseek-v4-flash",
        temperature: 0.3,
        maxTokens: 2000,
        isActive: true,
        apiKey: globalApiKey || undefined,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setConfigs((prev) => {
        const filtered = prev.filter((c) => c.taskType !== GLOBAL_TASK)
        return [...filtered, updated]
      })
      setGlobalApiKey("")
    }
    setSaving(false)
  }

  async function saveTaskConfig(config: ModelConfig) {
    const provider = (document.getElementById(`provider-${config.taskType}`) as HTMLInputElement)?.value
    const model = (document.getElementById(`model-${config.taskType}`) as HTMLInputElement)?.value
    const temperature = parseFloat((document.getElementById(`temp-${config.taskType}`) as HTMLInputElement)?.value)
    const maxTokens = parseInt((document.getElementById(`tokens-${config.taskType}`) as HTMLInputElement)?.value)

    const res = await fetch("/api/admin/ai-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: config.id,
        taskType: config.taskType,
        provider,
        model,
        temperature,
        maxTokens,
        isActive: config.isActive,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setEditing(null)
    }
  }

  async function addTask(taskType: string) {
    const defaults = DEFAULT_TASKS.find((t) => t.taskType === taskType)
    if (!defaults) return
    const res = await fetch("/api/admin/ai-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(defaults),
    })
    if (res.ok) {
      const config = await res.json()
      setConfigs((prev) => [...prev, config])
    }
  }

  const existingTypes = new Set(taskConfigs.map((c) => c.taskType))
  const missingTasks = DEFAULT_TASKS.filter((t) => !existingTypes.has(t.taskType))

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      <h2 className="text-lg font-medium text-foreground">AI Model Configuration</h2>

      {/* Global config */}
      <section className="rounded-xl bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Global Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">API Key</label>
            <div className="flex gap-2">
              <input
                type={showKey ? "text" : "password"}
                value={globalApiKey}
                onChange={(e) => setGlobalApiKey(e.target.value)}
                placeholder={globalConfig?.apiKeyEncrypted ? "••••••••" : "Enter your OpenCode Go API key"}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
              <button onClick={() => setShowKey(!showKey)} className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted">
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {globalConfig?.apiKeyEncrypted
                ? "Key is stored (encrypted). Enter a new value to replace it, or leave blank to keep the existing one."
                : "Key is encrypted at rest using JWT_SECRET. Never stored in plaintext."}
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Default Model</label>
            <input
              id="global-model"
              defaultValue={globalConfig?.model || "deepseek-v4-flash"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
            <p className="mt-0.5 text-xs text-muted-foreground">
              Used as fallback when a task doesn&apos;t specify its own model override.
            </p>
          </div>
          <button
            onClick={saveGlobal}
            disabled={saving}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Global Settings"}
          </button>
        </div>
      </section>

      {/* Per-task configs */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Per-Task Overrides</h3>
        {taskConfigs.map((config) => (
          <div key={config.id} className="rounded-xl bg-card p-5 shadow-sm text-sm">
            {editing === config.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Provider</label>
                    <input id={`provider-${config.taskType}`} defaultValue={config.provider} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Model</label>
                    <input id={`model-${config.taskType}`} defaultValue={config.model} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Temperature</label>
                    <input id={`temp-${config.taskType}`} type="number" step="0.1" defaultValue={config.temperature} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Tokens</label>
                    <input id={`tokens-${config.taskType}`} type="number" defaultValue={config.maxTokens} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveTaskConfig(config)} className="rounded-lg bg-secondary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-secondary/90">
                    Save
                  </button>
                  <button onClick={() => setEditing(null)} className="rounded-lg border border-border bg-background px-4 py-1.5 text-sm text-foreground transition-colors hover:bg-muted">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{TASK_LABELS[config.taskType] || config.taskType}</p>
                  <p className="text-muted-foreground">{config.provider}/{config.model} — temp: {config.temperature} — max: {config.maxTokens}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${config.isActive ? "bg-green-500" : "bg-red-500"}`} />
                  <button onClick={() => setEditing(config.id)} className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80">Edit</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {missingTasks.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-muted-foreground">Unconfigured tasks (click to add with defaults):</p>
            <div className="flex flex-wrap gap-2">
              {missingTasks.map((task) => (
                <button
                  key={task.taskType}
                  onClick={() => addTask(task.taskType)}
                  className="rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-white"
                >
                  Add {TASK_LABELS[task.taskType] || task.taskType}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
