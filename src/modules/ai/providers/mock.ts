import type { AIProvider, ChatMessage, ChatResponse } from "@/modules/ai/types/ai"

const RESPONSES: Record<string, string> = {
  explain: `**Explanation of the Verse**

This passage reveals God's faithful character throughout Scripture. The original language conveys certainty and divine truth. In context, this reminds believers that God's promises are trustworthy and His character unchanging.

*Key themes:* Divine faithfulness, covenant loyalty (hesed), trustworthiness of God's Word
*Cross references:* Deuteronomy 7:9, 2 Timothy 2:13, Hebrews 10:23`,

  summary: `**Passage Summary**

This passage presents a cohesive theological message. Key themes include:

1. **Divine Initiative** — God acts first in redemption
2. **Human Response** — Faith as the appropriate response to grace
3. **Covenant Community** — The corporate nature of salvation

The structure follows: declaration → explanation → application, typical of biblical teaching.`,

  devotional: `**Daily Devotional**

*Reflection:* As you read this passage, consider how these timeless truths speak into your circumstances today. Scripture is living and active.

*Application:* Write down one truth from this passage you can apply today.

*Prayer:* Lord, thank You for Your Word. Help me not just hear it but do it. In Jesus' name, Amen.`,

  crossRefs: `**Cross References**

• Psalm 119:105 — "Your word is a lamp to my feet"
• Proverbs 3:5-6 — "Trust in the Lord with all your heart"
• Isaiah 55:11 — "My word shall not return void"
• Matthew 4:4 — "Man shall not live by bread alone"
• Romans 15:4 — "Written for our instruction"`,
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock"

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || ""
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 800))

    let content = RESPONSES.explain
    if (lastMsg.includes("summar")) content = RESPONSES.summary
    else if (lastMsg.includes("devotion")) content = RESPONSES.devotional
    else if (lastMsg.includes("cross")) content = RESPONSES.crossRefs
    else if (lastMsg.includes("question") || lastMsg.includes("study")) {
      content = `${RESPONSES.explain}\n\n---\n\n${RESPONSES.crossRefs}`
    }

    return { content, finishReason: "stop" }
  }

  async *stream(messages: ChatMessage[]): AsyncIterable<ChatResponse> {
    const result = await this.chat(messages)
    for (const char of result.content) {
      yield { content: char, finishReason: "stop" }
      await new Promise((r) => setTimeout(r, 15))
    }
  }

  async embeddings(texts: string[]): Promise<number[][]> {
    return texts.map(() => Array(1536).fill(0).map(() => Math.random() * 2 - 1))
  }
}
