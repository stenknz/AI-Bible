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
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-1 ring-white/10 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
        title="AI Assistant"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
        </svg>
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[520px] w-[360px] flex-col rounded-2xl border border-border/40 bg-card shadow-xl ring-1 ring-black/5 animate-scale-in">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
            </div>
            <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" /><path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">How can I help you?</p>
                <p className="mt-1 text-xs text-muted-foreground">Ask a Bible question, get study help, or explore theology.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-3 text-sm leading-relaxed animate-slide-up ${
                  m.role === "user"
                    ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-white"
                    : "mr-auto w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-foreground"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="mr-auto w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 animate-[typing-dot_1.4s_ease-in-out_infinite] rounded-full bg-muted-foreground/40" />
                  <span className="inline-block h-2 w-2 animate-[typing-dot_1.4s_ease-in-out_infinite_0.2s] rounded-full bg-muted-foreground/40" />
                  <span className="inline-block h-2 w-2 animate-[typing-dot_1.4s_ease-in-out_infinite_0.4s] rounded-full bg-muted-foreground/40" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-border/40 px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background pl-4 pr-1.5 transition-colors focus-within:border-secondary/50 focus-within:ring-2 focus-within:ring-secondary/10">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none bg-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-white transition-all duration-200 hover:bg-secondary/90 disabled:opacity-30 disabled:hover:bg-secondary"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
