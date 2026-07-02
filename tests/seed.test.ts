import { PrismaClient } from "@prisma/client"
import { describe, it, expect, afterAll } from "vitest"

const prisma = new PrismaClient()
afterAll(async () => { await prisma.$disconnect() })

describe("KJV Import", () => {
  it("has 66 books", async () => {
    const c = await prisma.book.count({ where: { translation: { code: "KJV" } } })
    expect(c).toBe(66)
  })

  it("has ~1,189 chapters", async () => {
    const c = await prisma.chapter.count({ where: { book: { translation: { code: "KJV" } } } })
    expect(c).toBeGreaterThanOrEqual(1189)
  })

  it("has ~31,102 verses", async () => {
    const c = await prisma.verse.count({ where: { chapter: { book: { translation: { code: "KJV" } } } } })
    expect(c).toBeGreaterThanOrEqual(31102)
  })

  it("no duplicate verses", async () => {
    const verses = await prisma.verse.findMany({ select: { chapterId: true, number: true } })
    const keys = verses.map((v) => `${v.chapterId}-${v.number}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("Genesis 1:1 exists", async () => {
    const v = await prisma.verse.findFirst({
      where: { chapter: { book: { name: "Genesis", translation: { code: "KJV" } }, number: 1 }, number: 1 },
    })
    expect(v?.text).toContain("beginning")
  })
})

describe("Seed Data", () => {
  it("has admin and user accounts", async () => {
    expect(await prisma.user.findUnique({ where: { email: "admin@example.com" } })).toBeTruthy()
    expect(await prisma.user.findUnique({ where: { email: "user@example.com" } })).toBeTruthy()
  })

  it("has 75+ notes for user", async () => {
    const user = await prisma.user.findUnique({ where: { email: "user@example.com" } })
    const c = await prisma.note.count({ where: { userId: user!.id } })
    expect(c).toBeGreaterThanOrEqual(75)
  })

  it("has highlights in OT and NT", async () => {
    const ot = await prisma.highlight.count({ where: { verse: { chapter: { book: { testament: "OLD" } } } } })
    const nt = await prisma.highlight.count({ where: { verse: { chapter: { book: { testament: "NEW" } } } } })
    expect(ot).toBeGreaterThan(10)
    expect(nt).toBeGreaterThan(10)
  })

  it("has 10+ map places", async () => expect(await prisma.place.count()).toBeGreaterThanOrEqual(10))

  it("has 10+ timeline events", async () => expect(await prisma.timelineEntry.count()).toBeGreaterThanOrEqual(10))

  it("has 20+ prayer entries", async () => expect(await prisma.prayerRequest.count()).toBeGreaterThanOrEqual(20))

  it("has 5+ reading plan templates", async () => expect(await prisma.readingPlanTemplate.count()).toBeGreaterThanOrEqual(5))

  it("strong's entries exist for hebrew and greek", async () => {
    const h = await prisma.strongNumber.count({ where: { language: "hebrew" } })
    const g = await prisma.strongNumber.count({ where: { language: "greek" } })
    expect(h).toBeGreaterThan(10)
    expect(g).toBeGreaterThan(10)
  })
})
