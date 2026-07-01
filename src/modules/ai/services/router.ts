import type { AITaskType, AIProviderConfig } from "@/modules/ai/types/ai"

type TaskRoute = {
  taskType: AITaskType
  primaryProvider: string
  fallbackProvider: string
  model: string
  temperature: number
  maxTokens: number
  requiresRag: boolean
  requiresCitation: boolean
}

const defaultRoutes: Record<AITaskType, TaskRoute> = {
  verse_explanation: {
    taskType: "verse_explanation",
    primaryProvider: "opencode-zen",
    fallbackProvider: "opencode-go",
    model: "default",
    temperature: 0.3,
    maxTokens: 500,
    requiresRag: true,
    requiresCitation: true,
  },
  passage_summary: {
    taskType: "passage_summary",
    primaryProvider: "opencode-zen",
    fallbackProvider: "opencode-go",
    model: "default",
    temperature: 0.3,
    maxTokens: 800,
    requiresRag: true,
    requiresCitation: true,
  },
  theological_question_answering: {
    taskType: "theological_question_answering",
    primaryProvider: "opencode-zen",
    fallbackProvider: "opencode-go",
    model: "default",
    temperature: 0.4,
    maxTokens: 1000,
    requiresRag: true,
    requiresCitation: true,
  },
  cross_reference_generation: {
    taskType: "cross_reference_generation",
    primaryProvider: "opencode-zen",
    fallbackProvider: "opencode-go",
    model: "default",
    temperature: 0.2,
    maxTokens: 600,
    requiresRag: true,
    requiresCitation: true,
  },
  devotional_generation: {
    taskType: "devotional_generation",
    primaryProvider: "opencode-zen",
    fallbackProvider: "opencode-go",
    model: "default",
    temperature: 0.7,
    maxTokens: 800,
    requiresRag: false,
    requiresCitation: true,
  },
  study_plan_generation: {
    taskType: "study_plan_generation",
    primaryProvider: "opencode-zen",
    fallbackProvider: "opencode-go",
    model: "default",
    temperature: 0.5,
    maxTokens: 1000,
    requiresRag: false,
    requiresCitation: false,
  },
  quiz_generation: {
    taskType: "quiz_generation",
    primaryProvider: "opencode-zen",
    fallbackProvider: "opencode-go",
    model: "default",
    temperature: 0.6,
    maxTokens: 800,
    requiresRag: true,
    requiresCitation: true,
  },
}

export function getRoute(taskType: AITaskType): TaskRoute {
  const envOverride = process.env[`AI_ROUTE_${taskType.toUpperCase()}_PROVIDER`]
  const route = { ...defaultRoutes[taskType] }
  if (envOverride) route.primaryProvider = envOverride
  return route
}

export function getActiveProvider(): string {
  return process.env.ACTIVE_PROVIDER || "opencode-zen"
}
