export type ImportOptions = {
  source: string
  version: string
  incremental?: boolean
  batchSize?: number
  onProgress?: (stats: ImportStats) => void
}

export type ImportStats = {
  total: number
  inserted: number
  updated: number
  skipped: number
  errors: number
  duration: number
}

export type NormalizedEntry = {
  source: string
  title: string
  slug: string
  content: string
  summary?: string
  aliases?: string[]
  category?: string
  scriptureRefs?: string[]
  keywords?: string[]
  metadata?: Record<string, unknown>
  verseId?: string
  verseStartId?: string
  verseEndId?: string
}

export type ValidationError = {
  line?: number
  field: string
  message: string
}
