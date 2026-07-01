import type { AIProviderConfig } from "@/modules/ai/types/ai"
import type { TaskHandler, TaskInput } from "./define"
import { buildVerseExplanationPrompt } from "@/modules/ai/prompts/verse-explanation"
import { buildContext } from "@/modules/ai/services/context-builder"
import { providerRegistry } from "@/modules/ai/services/provider"
import { getActiveProvider, getRoute } from "@/modules/ai/services/router"

export const verseExplanationHandler: TaskHandler = {
  taskType: "verse_explanation",
  requiresRag: true,

  async handle(input: TaskInput): Promise<string> {
    const route = getRoute("verse_explanation")

    let context = ""
    if (input.verseIds) {
      const ctx = await buildContext({
        verseIds: input.verseIds,
        query: input.query,
        includeChapterContext: true,
        includeCrossReferences: true,
      })
      context = ctx.scripture
    }

    const prompt = buildVerseExplanationPrompt(input.passageText || input.query, context)

    const provider = providerRegistry.get(getActiveProvider())
    const response = await provider.chat(
      [
        { role: "system", content: "You are a helpful Bible study assistant. Always cite verses." },
        { role: "user", content: prompt },
      ],
      { model: route.model, temperature: route.temperature, maxTokens: route.maxTokens } as AIProviderConfig
    )

    return response.content
  },
}
