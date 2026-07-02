import type { AIProvider, AIProviderConfig, ChatMessage, ChatResponse } from "@/modules/ai/types/ai"
import { prisma } from "@/lib/db"
import { decryptApiKey } from "@/modules/ai/services/secrets"

const GLOBAL_TASK = "__global__"
const DEFAULT_BASE = "https://opencode.ai/zen/go"

async function resolveApiKey(config?: AIProviderConfig): Promise<string> {
  if (config?.apiKey) return config.apiKey
  if (process.env.OPCODE_GO_API_KEY) return process.env.OPCODE_GO_API_KEY
  try {
    const global = await prisma.aIModelConfig.findUnique({ where: { taskType: GLOBAL_TASK } })
    if (global?.apiKeyEncrypted) return decryptApiKey(global.apiKeyEncrypted)
  } catch {}
  return ""
}

async function resolveDefaultModel(): Promise<string> {
  try {
    const global = await prisma.aIModelConfig.findUnique({ where: { taskType: GLOBAL_TASK } })
    if (global?.model) return global.model
  } catch {}
  return "deepseek-v4-flash"
}

export class OpenCodeGoProvider implements AIProvider {
  readonly name = "opencode-go"

  async chat(messages: ChatMessage[], config?: AIProviderConfig): Promise<ChatResponse> {
    const [apiKey, defaultModel] = await Promise.all([resolveApiKey(config), resolveDefaultModel()])
    const baseUrl = config?.baseUrl || process.env.OPCODE_GO_BASE_URL || DEFAULT_BASE
    const model = config?.model || defaultModel

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: config?.maxTokens || 2000,
        temperature: config?.temperature ?? 0.3,
      }),
    })

    const rawBody = await response.text()
    if (!response.ok) {
      throw new Error(`OpenCode Go API error (${response.status}): ${rawBody || response.statusText}`)
    }

    let data: any
    try {
      data = JSON.parse(rawBody)
    } catch {
      throw new Error(
        `OpenCode Go API returned unexpected response: ${rawBody.slice(0, 200)}` +
        `${!apiKey ? " — API key is not configured" : ""}`
      )
    }

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
    const [apiKey, defaultModel] = await Promise.all([resolveApiKey(config), resolveDefaultModel()])
    const baseUrl = config?.baseUrl || process.env.OPCODE_GO_BASE_URL || DEFAULT_BASE
    const model = config?.model || defaultModel

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: config?.maxTokens || 2000,
        temperature: config?.temperature ?? 0.3,
      }),
    })

    if (!response.ok || !response.headers.get("content-type")?.includes("text/event-stream")) {
      const rawBody = await response.text().catch(() => "")
      const hint = !apiKey ? " — API key is not configured" : ""
      throw new Error(`OpenCode Go API error (${response.status}): ${rawBody.slice(0, 200) || response.statusText}${hint}`)
    }

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
    const apiKey = await resolveApiKey()
    const baseUrl = process.env.OPCODE_GO_BASE_URL || DEFAULT_BASE

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
