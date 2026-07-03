import { BaseImporter } from "./base-importer"

const SOURCES: Record<string, new () => BaseImporter> = {
  // Will be populated as importers are written
}

async function main() {
  const args = process.argv.slice(2)
  const sourceFlag = args.find((a) => a.startsWith("--source="))
  const sourceName = sourceFlag?.split("=")[1]

  if (!sourceName || !SOURCES[sourceName]) {
    console.log("Usage: npx tsx scripts/import/import-runner.ts --source=<name>")
    console.log("Available sources:", Object.keys(SOURCES).join(", "))
    process.exit(1)
  }

  const ImporterClass = SOURCES[sourceName]
  const importer = new ImporterClass()

  console.log(`Starting import: ${importer.source} v${importer.version}`)

  const stats = await importer.run({
    source: importer.source,
    version: importer.version,
    batchSize: 100,
  })

  console.log(`\nImport complete:`)
  console.log(`  Total:    ${stats.total}`)
  console.log(`  Inserted: ${stats.inserted}`)
  console.log(`  Updated:  ${stats.updated}`)
  console.log(`  Skipped:  ${stats.skipped}`)
  console.log(`  Errors:   ${stats.errors}`)
  console.log(`  Duration: ${(stats.duration / 1000).toFixed(1)}s`)
}

main().catch((e) => {
  console.error("Import failed:", e)
  process.exit(1)
})
