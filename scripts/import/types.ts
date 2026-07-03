export interface ImportOptions {
  source: string
  version: string
  incremental?: boolean
  batchSize?: number
  onProgress?: (stats: ImportStats) => void
}

export interface ImportStats {
  total: number
  inserted: number
  updated: number
  skipped: number
  errors: number
  duration: number
}

export interface NormalizedEntry {
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

export interface ValidationError {
  line?: number
  field: string
  message: string
}
