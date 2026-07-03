import { prisma } from "@/lib/db"

export type ReasoningStep = {
  step: number
  action: "retrieve" | "retrieve_rag" | "analyze" | "synthesize" | "cite"
  input: string
  output: string
  sourcesUsed: string[]
  timestamp: Date
}

export async function beginTrace(): Promise<string> {
  return crypto.randomUUID()
}

export async function persistTrace(
  aimessageId: string,
  steps: ReasoningStep[],
  modelUsed: string,
  duration: number,
  tokenUsage?: { promptTokens: number; completionTokens: number }
) {
  return prisma.reasoningTrace.create({
    data: {
      aimessageId,
      steps: steps as any,
      duration,
      modelUsed,
      tokenUsage: tokenUsage as any ?? undefined,
    },
  })
}

export async function getTrace(aimessageId: string) {
  return prisma.reasoningTrace.findUnique({
    where: { aimessageId },
  })
}
