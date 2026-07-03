import { prisma } from "@/lib/db"
import { indexEntity, type EmbeddingSourceType } from "@/modules/ai/embeddings/service"

type EntityConfig = {
  type: EmbeddingSourceType
  model: any
  textFields: string[]
  label: string
}

const ENTITIES: EntityConfig[] = [
  { type: "dictionary", model: prisma.dictionaryEntry, textFields: ["title", "content"], label: "Dictionary" },
  { type: "commentary", model: prisma.commentaryEntry, textFields: ["title", "content"], label: "Commentary" },
  { type: "topic", model: prisma.topicEntry, textFields: ["topic", "description"], label: "Topic" },
  { type: "bible_event", model: prisma.bibleEvent, textFields: ["name", "description"], label: "Bible Event" },
  { type: "nation", model: prisma.nation, textFields: ["name", "description"], label: "Nation" },
  { type: "person", model: prisma.person, textFields: ["name", "description"], label: "Person" },
  { type: "place", model: prisma.place, textFields: ["name", "description"], label: "Place" },
]

async function embedEntityType(config: EntityConfig) {
  console.log(`\nEmbedding ${config.label} entries...`)
  const records = await config.model.findMany()
  let count = 0

  for (const record of records) {
    const text = config.textFields
      .map((f) => record[f])
      .filter(Boolean)
      .join(" — ")
      .slice(0, 2000)

    if (!text) continue

    try {
      await indexEntity(config.type, record.id, text)
      count++
    } catch (e) {
      console.error(`  Error embedding ${config.label} ${record.id}:`, e)
    }

    if (count % 50 === 0) console.log(`  ${count}/${records.length} embedded...`)
  }

  console.log(`  Done: ${count}/${records.length} ${config.label} entries embedded`)
}

async function main() {
  const typeFilter = process.argv.find((a) => a.startsWith("--type="))?.split("=")[1]
  const filtered = typeFilter ? ENTITIES.filter((e) => e.type === typeFilter) : ENTITIES

  console.log(`Embedding ${filtered.length} entity types...`)
  for (const config of filtered) {
    await embedEntityType(config)
  }
  console.log("\nAll embeddings complete.")
}

main().catch((e) => {
  console.error("Embedding failed:", e)
  process.exit(1)
})
