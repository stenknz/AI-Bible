"use client"

import { useEffect, useRef, useState } from "react"
import type { TimelineEventData } from "@/modules/timeline/types/timeline"

type Props = {
  events: TimelineEventData[]
  mode?: "VERTICAL" | "HORIZONTAL" | "VERTICAL_ALTERNATING"
}

export function TimelineView({ events, mode = "VERTICAL_ALTERNATING" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    async function loadChrono() {
      const { Chrono } = await import("react-chrono")

      if (!containerRef.current) return



      containerRef.current.innerHTML = ""

      // Use React 19 createRoot + render to mount the Chrono component
      const { createRoot } = await import("react-dom/client")
      const { default: React } = await import("react")

      const items = events.map((event) => ({
        title: event.startYear
          ? `${event.startYear}${event.endYear && event.endYear !== event.startYear ? ` - ${event.endYear}` : ""}`
          : "",
        cardTitle: event.title,
        cardSubtitle: event.periodName ?? undefined,
        cardDetailedText: event.description ?? "",
      }))

      if (items.length === 0) {
        containerRef.current.innerHTML = '<p class="text-center text-sm py-8" style="color: var(--color-muted-foreground)">No timeline events loaded yet.</p>'
        return
      }

      const root = document.createElement("div")
      containerRef.current.appendChild(root)
      const rootInstance = createRoot(root)

      rootInstance.render(
        React.createElement(Chrono, {
          items,
          mode,
          theme: {
            primary: "#3b82f6",
            secondary: "#f5f5f5",
            cardBgColor: "#ffffff",
            cardDetailsColor: "#0a0a0a",
            titleColor: "#737373",
          },
          slideShow: true,
          slideShowType: "slide_in" as any,
          scrollable: { scrollbar: true },
        })
      )

      setReady(true)
    }

    loadChrono()
  }, [events, mode])

  if (events.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">No timeline events loaded yet.</p>
  }

  return <div ref={containerRef} className="w-full min-h-[400px]" />
}
