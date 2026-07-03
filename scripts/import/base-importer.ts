import type { ImportOptions, ImportStats, NormalizedEntry, ValidationError } from "./types"

export async function downloadJSONL(url: string): Promise<string[]> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`)
  const text = await response.text()
  return text.split("\n").filter(Boolean)
}

export function parseJSONL<T>(lines: string[]): T[] {
  const results: T[] = []
  for (let i = 0; i < lines.length; i++) {
    try {
      results.push(JSON.parse(lines[i]))
    } catch {
      console.warn(`Skipping invalid JSON at line ${i + 1}`)
    }
  }
  return results
}

export abstract class BaseImporter {
  abstract readonly source: string
  abstract readonly version: string

  abstract load(): Promise<NormalizedEntry[]>
  abstract validate(entries: NormalizedEntry[]): ValidationError[]
  abstract persist(entries: NormalizedEntry[]): Promise<ImportStats>

  async run(options: ImportOptions): Promise<ImportStats> {
    const startTime = Date.now()
    const stats: ImportStats = { total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0, duration: 0 }

    console.log(`[${this.source}] Loading...`)
    const entries = await this.load()
    stats.total = entries.length
    console.log(`[${this.source}] Loaded ${entries.length} entries`)
    options.onProgress?.(stats)

    const validationErrors = this.validate(entries)
    if (validationErrors.length > 0) {
      console.error(`[${this.source}] ${validationErrors.length} validation errors`)
      for (const err of validationErrors.slice(0, 10)) {
        console.error(`  ${err.field}: ${err.message}`)
      }
      stats.errors = validationErrors.length
    }

    const persistStats = await this.persist(entries)
    stats.inserted = persistStats.inserted
    stats.updated = persistStats.updated
    stats.skipped = persistStats.skipped
    stats.errors += persistStats.errors

    stats.duration = Date.now() - startTime
    console.log(`[${this.source}] Done: ${stats.inserted} inserted, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.errors} errors in ${stats.duration}ms`)

    return stats
  }
}
