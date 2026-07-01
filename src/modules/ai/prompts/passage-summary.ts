export function buildPassageSummaryPrompt(passageText: string): string {
  return `Summarize the following Bible passage. Include:
1. A brief overview (2-3 sentences)
2. Key themes
3. Main characters
4. Theological significance

Passage:
${passageText}

Always cite specific verses. Separate Scripture from interpretation.`
}
