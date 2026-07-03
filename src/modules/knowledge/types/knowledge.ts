export type KnowledgeEntityType =
  | "dictionary"
  | "commentary"
  | "topic"
  | "bible_event"
  | "nation"
  | "person"
  | "place"
  | "verse"
  | "timeline"

export interface KnowledgeSearchResult {
  id: string
  entityType: KnowledgeEntityType
  title: string
  slug: string
  snippet: string
  score: number
  source?: string
  category?: string
  reference?: string
}

export interface KnowledgeSearchResponse {
  query: string
  results: Record<string, KnowledgeSearchResult[]>
  totalResults: number
}

export interface EntityDetail<T = unknown> {
  id: string
  type: KnowledgeEntityType
  data: T
  related: EntityRelation[]
}

export interface EntityRelation {
  predicate: string
  subjectId: string
  subjectType: KnowledgeEntityType
  objectId: string
  objectType: KnowledgeEntityType
}
