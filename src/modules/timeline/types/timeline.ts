export type TimelineEventData = {
  id: string
  title: string
  description: string | null
  startYear: number | null
  endYear: number | null
  periodName: string | null
  importance: number
}

export type PeriodData = {
  id: string
  name: string
  startYear: number | null
  endYear: number | null
  order: number
}
