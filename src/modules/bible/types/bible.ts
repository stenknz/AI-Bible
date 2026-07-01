export type VerseData = {
  id: string
  number: number
  text: string
  isRedLetter: boolean
}

export type ChapterData = {
  id: string
  number: number
  verses: VerseData[]
}

export type BookData = {
  id: string
  number: number
  name: string
  testament: "OLD" | "NEW"
}

export type TranslationData = {
  id: string
  code: string
  name: string
  isDefault: boolean
}
