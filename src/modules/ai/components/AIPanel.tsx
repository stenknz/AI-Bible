"use client"

import { useState, useRef, useEffect } from "react"

type Message = {
  role: "user" | "assistant"
  content: string
}

export function AIPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          taskType: "theological_question_answering",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
        setConversationId(data.conversationId)
      } else {
        const data = await res.json().catch(() => ({ error: "Sorry, I couldn't process that request." }))
        setMessages((prev) => [...prev, { role: "assistant", content: data.error }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "An error occurred. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        title="AI Assistant"
      >
        <span className="text-lg">AI</span>
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[500px] w-80 flex-col rounded-lg border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="text-sm font-semibold">AI Assistant</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ask a Bible question, request a verse explanation, or get study help.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-3 rounded-lg p-3 text-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white ml-8"
                    : "bg-muted text-foreground mr-8"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="mb-3 mr-8 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="border-t p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
