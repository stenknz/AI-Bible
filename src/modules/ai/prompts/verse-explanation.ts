export function buildVerseExplanationPrompt(verseText: string, context: string): string {
  return `Explain the following verse clearly and faithfully to Scripture. Be very concise (2-3 paragraphs max).

${context ? `Context:\n${context}\n` : ""}

Verse:
${verseText}

Provide:
1. The plain meaning
2. Key themes
3. How it fits

Cite verse references. Keep it brief.`
}
