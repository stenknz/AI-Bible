"use client"

import { useState } from "react"

export function BibleImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !code || !name) return
    setLoading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("code", code)
    formData.append("name", name)
    const res = await fetch("/api/admin/bible/import", { method: "POST", body: formData })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Translation Code</label>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="KJV" className="w-full rounded-lg border px-3 py-2 text-sm" required />
      </div>
      <div>
        <label className="block text-sm font-medium">Translation Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="King James Version" className="w-full rounded-lg border px-3 py-2 text-sm" required />
      </div>
      <div>
        <label className="block text-sm font-medium">TSV File</label>
        <input type="file" accept=".txt,.tsv,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm" required />
      </div>
      <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Importing..." : "Import Bible"}
      </button>
      {result && (
        <div className="rounded-lg border p-4 text-sm">
          <p>Imported: {result.imported} verses</p>
          <p>Skipped: {result.skipped} lines</p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="font-medium">Errors:</p>
              <ul className="list-inside list-disc text-red-500">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
