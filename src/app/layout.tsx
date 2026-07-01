import type { Metadata } from "next"
import "./globals.css"
import { OpenCodeZenProvider } from "@/modules/ai/providers/opencode-zen"
import { providerRegistry } from "@/modules/ai/services/provider"

if (typeof window === "undefined") {
  providerRegistry.register("opencode-zen", new OpenCodeZenProvider())
}

export const metadata: Metadata = {
  title: "BibleHub AI",
  description: "AI-powered Bible study platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
