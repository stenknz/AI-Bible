export function buildVerseExplanationPrompt(verseText: string, context: string): string {
  return `You are a Bible study assistant. Explain the following verse clearly and faithfully to Scripture.

${context ? `Context:\n${context}\n` : ""}

Verse:
${verseText}

Provide:
1. The plain meaning of the verse
2. Key themes and concepts
3. How it fits in the broader passage
4. A brief application

Always cite verse references. Separate Scripture from interpretation.`
}
