import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"

const BOOKS_66 = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
  "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
  "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation",
]

const GOSPELS = new Set(["Matthew", "Mark", "Luke", "John"])
const BOOK_ALIASES: Record<string, string> = { "Psalm": "Psalms", "Song": "Song of Solomon" }

const prisma = new PrismaClient()

async function importBible(filePath: string, code: string, name: string) {
  console.log(`\n📖 Importing ${name} (${code}) from ${filePath}...`)
  const startTime = Date.now()

  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n").filter((l) => l.trim())
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  const translation = await prisma.translation.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  })

  type Row = { bookName: string; chapterNum: number; verseNum: number; text: string }
  const verseData: Row[] = []

  for (const line of lines) {
    if (line === code || line.startsWith("King James Bible")) continue
    const match = line.match(/^(.+?)\s(\d+):(\d+)\t(.+)$/)
    if (!match) { skipped++; continue }
    verseData.push({
      bookName: match[1].trim(),
      chapterNum: parseInt(match[2], 10),
      verseNum: parseInt(match[3], 10),
      text: match[4].trim(),
    })
  }

  const books = new Map<string, Row[]>()
  for (const v of verseData) {
    const existing = books.get(v.bookName) || []
    existing.push(v)
    books.set(v.bookName, existing)
  }

  let totalBooks = 0, totalChapters = 0

  for (const [bookName, verses] of books) {
    const normalized = BOOK_ALIASES[bookName] || bookName
    const bookIndex = BOOKS_66.indexOf(normalized as typeof BOOKS_66[number])
    if (bookIndex === -1) { errors.push(`Unknown book: ${bookName}`); continue }

    const book = await prisma.book.upsert({
      where: { translationId_number: { translationId: translation.id, number: bookIndex + 1 } },
      update: { name: normalized, testament: bookIndex < 39 ? "OLD" : "NEW" },
      create: { translationId: translation.id, number: bookIndex + 1, name: bookName, testament: bookIndex < 39 ? "OLD" : "NEW" },
    })
    totalBooks++

    const chapters = new Map<number, Row[]>()
    for (const v of verses) {
      const existing = chapters.get(v.chapterNum) || []
      existing.push(v)
      chapters.set(v.chapterNum, existing)
    }

    for (const [chapterNum, chapterVerses] of chapters) {
      const chapter = await prisma.chapter.upsert({
        where: { bookId_number: { bookId: book.id, number: chapterNum } },
        update: {},
        create: { bookId: book.id, number: chapterNum },
      })
      totalChapters++

      for (const v of chapterVerses) {
        const isRed = GOSPELS.has(bookName) && (v.text.startsWith('"') || v.text.startsWith("And he said") || v.text.startsWith("Jesus said"))
        await prisma.verse.upsert({
          where: { chapterId_number: { chapterId: chapter.id, number: v.verseNum } },
          update: { text: v.text, isRedLetter: isRed },
          create: { chapterId: chapter.id, number: v.verseNum, text: v.text, isRedLetter: isRed },
        })
        imported++
      }
    }
    process.stdout.write(`\r  📚 ${bookName.padEnd(20)} ${verses.length} verses`)
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n\n✅ Import summary:`)
  console.log(`   Books:     ${totalBooks}/${BOOKS_66.length}`)
  console.log(`   Chapters:  ${totalChapters}`)
  console.log(`   Verses:    ${imported}`)
  console.log(`   Skipped:   ${skipped}`)
  console.log(`   Duration:  ${duration}s`)

  const vBooks = await prisma.book.count({ where: { translationId: translation.id } })
  const vChapters = await prisma.chapter.count({ where: { book: { translationId: translation.id } } })
  const vVerses = await prisma.verse.count({ where: { chapter: { book: { translationId: translation.id } } } })
  console.log(`\n🔍 Verification:`)
  console.log(`   Books:     ${vBooks} ✅`)
  console.log(`   Chapters:  ${vChapters} ✅`)
  console.log(`   Verses:    ${vVerses} ✅`)

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors (${errors.length}): ${errors.slice(0, 5).join(", ")}`)
  }

  await prisma.$disconnect()
}

const filePath = process.argv[2] || "kjv.txt"
const code = process.argv[3] || "KJV"
const name = process.argv[4] || "King James Version"

importBible(filePath, code, name).catch((e) => {
  console.error("Import failed:", e)
  process.exit(1)
})
