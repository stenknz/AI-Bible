import { BaseImporter } from "./base-importer"
import { EastonsImporter } from "./sources/eastons"

const SOURCES: Record<string, new () => BaseImporter> = {
  easton: EastonsImporter,
}

async function main() {
  const args = process.argv.slice(2)
  const sourceArg = args.find((a) => a.startsWith("--source="))
  const fileArg = args.find((a) => a.startsWith("--file="))
  const sourceName = sourceArg ? sourceArg.slice("--source=".length) : ""
  const filePath = fileArg ? fileArg.slice("--file=".length) : ""

  if (!sourceName || !SOURCES[sourceName]) {
    console.log("Usage: npx tsx scripts/import/import-runner.ts --source=<name> [--file=<path>]")
    console.log("Available sources:", Object.keys(SOURCES).join(", "))
    process.exit(1)
  }

  const ImporterClass = SOURCES[sourceName]
  const importer = new ImporterClass()

  console.log(`Starting import: ${importer.source} v${importer.version}`)

  const stats = await importer.run({
    source: sourceName,
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
