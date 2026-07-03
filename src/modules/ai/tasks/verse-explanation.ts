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

    // Build system prompt with optional RAG context
    const systemParts: string[] = [
      "You are a Bible study assistant focused on Christianity and the Bible. " +
      "If asked about non-Christian topics, politely decline. " +
      "Always cite verses. Be concise — respond in 2-3 paragraphs max.",
    ]

    if (input.ragContext) {
      systemParts.push(
        "You have access to the following study resources to inform your answer:\n" +
        input.ragContext +
        "\n\nWhen using information from these resources, cite them by name (e.g., 'According to Easton's Bible Dictionary...' or 'Matthew Henry comments...')."
      )
    }

    const prompt = buildVerseExplanationPrompt(input.passageText || input.query, context)

    const provider = providerRegistry.get(getActiveProvider())
    const response = await provider.chat(
      [
        { role: "system", content: systemParts.join("\n\n") },
        { role: "user", content: prompt },
      ],
      { model: route.model, temperature: route.temperature, maxTokens: 3000 } as AIProviderConfig
    )

    return response.content
  },
}
