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
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Reading Plans</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-secondary/90"
        >
          {showForm ? "Cancel" : "New Plan"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 space-y-4 rounded-xl bg-card p-6 shadow-sm">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Plan Name</label>
            <input
              type="text"
              placeholder="e.g. Read through the Bible"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30"
              required
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Days</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30"
                min={1}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
          </div>
          <button type="submit" className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90">
            Create Plan
          </button>
        </form>
      )}

      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-xl bg-card p-6 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-foreground">{plan.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{plan.type} &mdash; {plan.completed}/{plan.total} days</p>
              </div>
              <span className="ml-4 text-lg font-bold text-secondary">{plan.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-500"
                style={{ width: `${plan.progress}%` }}
              />
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="rounded-xl bg-card p-8 text-center shadow-sm">
            <svg className="mx-auto mb-3 h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="text-sm text-muted-foreground">No reading plans yet. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}
