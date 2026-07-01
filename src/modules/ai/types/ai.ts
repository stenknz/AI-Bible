export type ChatRole = "system" | "user" | "assistant" | "tool"

export type ChatMessage = {
  role: ChatRole
  content: string
  name?: string
}

export type ChatResponse = {
  content: string
  finishReason: "stop" | "length" | "error"
  usage?: { promptTokens: number; completionTokens: number }
}

export type AIProviderConfig = {
  apiKey: string
  baseUrl: string
  model: string
  maxTokens?: number
  temperature?: number
}

export interface AIProvider {
  readonly name: string
  chat(messages: ChatMessage[], config?: AIProviderConfig): Promise<ChatResponse>
  stream(messages: ChatMessage[], config?: AIProviderConfig): AsyncIterable<ChatResponse>
  embeddings(texts: string[]): Promise<number[][]>
}

export type AITaskType =
  | "verse_explanation"
  | "passage_summary"
  | "theological_question_answering"
  | "cross_reference_generation"
  | "devotional_generation"
  | "study_plan_generation"
  | "quiz_generation"
