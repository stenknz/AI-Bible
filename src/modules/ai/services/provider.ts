import type { AIProvider } from "@/modules/ai/types/ai"
import { OpenCodeZenProvider } from "@/modules/ai/providers/opencode-zen"
import { MockAIProvider } from "@/modules/ai/providers/mock"

class AIProviderRegistry {
  private providers: Map<string, AIProvider> = new Map()

  register(name: string, provider: AIProvider): void {
    this.providers.set(name, provider)
  }

  get(name: string): AIProvider {
    const provider = this.providers.get(name)
    if (!provider) throw new Error(`AI provider "${name}" not registered`)
    return provider
  }

  list(): string[] {
    return Array.from(this.providers.keys())
  }
}

export const providerRegistry = new AIProviderRegistry()

// Register providers at module load time for API routes
if (typeof window === "undefined") {
  providerRegistry.register("opencode-zen", new OpenCodeZenProvider())
  providerRegistry.register("mock", new MockAIProvider())
}
