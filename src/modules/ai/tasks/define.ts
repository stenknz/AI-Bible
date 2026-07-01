import type { AITaskType } from "@/modules/ai/types/ai"

export type TaskHandler = {
  taskType: AITaskType
  requiresRag: boolean
  handle(input: TaskInput): Promise<string>
}

export type TaskInput = {
  query: string
  verseIds?: string[]
  passageText?: string
  context?: string
}
