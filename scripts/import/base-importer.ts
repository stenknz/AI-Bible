import type { ImportOptions, ImportStats, NormalizedEntry } from "./types"

export abstract class BaseImporter {
  abstract readonly source: string
  abstract readonly version: string

  abstract load(input: string): Promise<NormalizedEntry[]>
  abstract validate(entries: NormalizedEntry[]): string[]
  abstract persist(entries: NormalizedEntry[]): Promise<ImportStats>

  async run(options: ImportOptions): Promise<ImportStats> {
    const startTime = Date.now()
    const stats: ImportStats = { total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0, duration: 0 }

    console.log(`[${this.source}] Loading...`)
    const entries = await this.load(options.source)
    stats.total = entries.length
    console.log(`[${this.source}] Loaded ${entries.length} entries`)
    options.onProgress?.(stats)

    const validationErrors = this.validate(entries)
    if (validationErrors.length > 0) {
      console.error(`[${this.source}] ${validationErrors.length} validation errors`)
      for (const err of validationErrors.slice(0, 10)) {
        console.error(`  ${err}`)
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
