import type { AIProvider, AIProviderConfig, ChatMessage, ChatResponse } from "@/modules/ai/types/ai"

export class OpenCodeZenProvider implements AIProvider {
  readonly name = "opencode-zen"

  async chat(messages: ChatMessage[], config?: AIProviderConfig): Promise<ChatResponse> {
    const baseUrl = config?.baseUrl || process.env.OPCODE_ZEN_BASE_URL || "https://api.opencode.ai"
    const apiKey = config?.apiKey || process.env.OPCODE_ZEN_API_KEY || ""
    const model = config?.model || "zen-1"

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: config?.maxTokens || 500,
        temperature: config?.temperature || 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenCode Zen API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.choices?.[0]?.message?.content || "",
      finishReason: data.choices?.[0]?.finish_reason || "stop",
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
      },
    }
  }

  async *stream(messages: ChatMessage[], config?: AIProviderConfig): AsyncIterable<ChatResponse> {
    const baseUrl = config?.baseUrl || process.env.OPCODE_ZEN_BASE_URL || "https://api.opencode.ai"
    const apiKey = config?.apiKey || process.env.OPCODE_ZEN_API_KEY || ""

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config?.model || "zen-1",
        messages,
        stream: true,
        max_tokens: config?.maxTokens || 500,
        temperature: config?.temperature || 0.3,
      }),
    })

    if (!response.ok) throw new Error(`OpenCode Zen API error: ${response.statusText}`)

    const reader = response.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      for (const line of chunk.split("\n").filter((l) => l.startsWith("data: "))) {
        const data = JSON.parse(line.slice(6))
        yield {
          content: data.choices?.[0]?.delta?.content || "",
          finishReason: data.choices?.[0]?.finish_reason || "stop",
        }
      }
    }
  }

  async embeddings(texts: string[]): Promise<number[][]> {
    const baseUrl = process.env.OPCODE_ZEN_BASE_URL || "https://api.opencode.ai"
    const apiKey = process.env.OPCODE_ZEN_API_KEY || ""

    const response = await fetch(`${baseUrl}/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts,
      }),
    })

    if (!response.ok) throw new Error(`Embedding API error: ${response.statusText}`)
    const data = await response.json()
    return data.data.map((d: any) => d.embedding)
  }
}
