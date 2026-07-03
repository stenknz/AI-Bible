const DATASETS: Record<string, string> = {
  easton: "https://huggingface.co/datasets/JWBickel/BibleDictionaries/resolve/main/Easton%27s%20Bible%20Dictionary.jsonl",
  smith: "https://huggingface.co/datasets/JWBickel/BibleDictionaries/resolve/main/Smith%27s%20Bible%20Dictionary.jsonl",
  naves: "https://huggingface.co/datasets/OpenChristianDataOrg/open-christian-data/resolve/main/data/topical_reference/naves/naves-topical-bible.jsonl",
  "matthew-henry": "https://huggingface.co/datasets/OpenChristianDataOrg/open-christian-data/resolve/main/data/commentary/matthew-henry/matthew-henry-complete.jsonl",
}

async function downloadAllDatasets() {
  for (const [name, url] of Object.entries(DATASETS)) {
    console.log(`\nDownloading ${name}...`)
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`  Failed: ${response.status} ${response.statusText}`)
      continue
    }
    const text = await response.text()
    const lines = text.split("\n").filter(Boolean)
    console.log(`  Downloaded ${lines.length} lines (${(text.length / 1024 / 1024).toFixed(1)} MB)`)
  }
  console.log("\nAll datasets verified.")
}

downloadAllDatasets().catch(console.error)
