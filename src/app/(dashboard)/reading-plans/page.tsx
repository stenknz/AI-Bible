"use client"

import { useState, useEffect } from "react"

type PlanProgress = {
  id: string
  name: string
  type: string
  completed: number
  total: number
  progress: number
}

export default function ReadingPlansPage() {
  const [plans, setPlans] = useState<PlanProgress[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [days, setDays] = useState("365")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    fetch("/api/reading-plans/progress").then((r) => r.json()).then(setPlans)
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/reading-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type: "custom",
        startDate: new Date(startDate),
        days: parseInt(days),
      }),
    })
    if (res.ok) {
      const plan = await res.json()
      setPlans((prev) => [...prev, { id: plan.id, name: plan.name, type: plan.type, completed: 0, total: parseInt(days), progress: 0 }])
      setShowForm(false)
      setName("")
      setDays("365")
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Reading Plans</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "New Plan"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 space-y-3 rounded-lg border p-4">
          <input
            type="text"
            placeholder="Plan name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            required
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Days</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                min={1}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
            Create Plan
          </button>
        </form>
      )}

      <div className="space-y-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-lg border p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="font-medium">{plan.name}</p>
                <p className="text-xs text-muted-foreground">{plan.type} — {plan.completed}/{plan.total} days</p>
              </div>
              <span className="text-sm font-semibold">{plan.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${plan.progress}%` }}
              />
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No reading plans yet. Create one to get started!</p>
        )}
      </div>
    </div>
  )
}
