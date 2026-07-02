# BibleHub AI — Feature Integration Design

## Overview

Connect every page of BibleHub AI into a unified study experience. Integrate open source biblical datasets to enrich the Bible reader, knowledge graph, maps, and original language study with cross-references, verse-linked entities, and rich geography.

## Data Sources

| Source | Content | License | Integration |
|--------|---------|---------|-------------|
| **Gnosis** (spearssoftware/gnosis) | 3,000+ people, 1,200+ places, 450+ events, 29,000+ verse cross-references, people/place→verse links | CC-BY-SA 4.0 | Primary enrichment — imported into PostgreSQL via seed script |
| **TSK Cross-References** (CrossReferences-org) | Treasury of Scripture Knowledge — KJV verse→verse cross-references | CC BY 4.0 | Import into new `CrossReference` table |
| **OpenBible.info Geocoding** | Comprehensive biblical place coordinates + verse associations | CC-BY | Supplement place data |

## Schema Changes

```prisma
model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  verseId   String
  label     String?
  createdAt DateTime @default(now())

  @@unique([userId, verseId])
  @@index([userId])
}

model CrossReference {
  fromVerseId String
  toVerseId   String
  weight      Int      @default(1)
  source      String   @default("tsk") // which dataset

  @@id([fromVerseId, toVerseId])
  @@index([toVerseId])
  @@index([fromVerseId])
}
```

## 1. Bible Reader Overhaul

### Navigation
- **Book selector dropdown** at top of reader: alphabetical list of 66 books, grouped by testament
- **Chapter selector grid**: when hovering book selector, show a 1–150 grid of chapter numbers
- **Bottom-of-page navigation**: fixed bar with previous/next chapter buttons, chapter progress ("Chapter 5 of 22"), keyboard shortcuts unchanged
- **Translation selector**: dropdown to switch between available translations

### Verse Interaction
- **Highlighting**: click verse number → color picker (yellow, green, blue, pink) → save to `Highlight` model. Toggle off to remove.
- **Inline notes**: click verse → "Add note" button → inline TipTap editor expandable below the verse → creates `Note` with `verseId`
- **Bookmarking**: star icon next to verse number → toggle `Bookmark` on/off

### Cross-References
- **References panel**: sidebar or bottom drawer showing cross-references for the current verse
- Each cross-reference shows: target verse reference + preview text
- Click → navigate to that verse
- Sources: imported TSK data, displayed as "See also: Genesis 1:1, Psalm 33:6..."

### Red Letter
- Already supported via `Verse.isRedLetter` field
- Currently uses heuristic detection; enhance by importing Gnosis data which has reliable red-letter markup
- Display in `text-red-600 dark:text-red-400` (already done in VerseDisplay)

### Reading Progress
- Track which chapters the user has visited
- Show progress indicators in the chapter selector grid

## 2. Original Language Study — In-Reader

### Interlinear Mode
- Toggle button in reader controls: "Show Original Language"
- When active, each verse word becomes clickable
- On click: popover showing Strong's number, transliteration, gloss, morphology
- Data loaded on demand via `InterlinearMapping` for the current chapter

### Strong's Integration
- Strong's numbers from the Gnosis dataset linked to verses
- `OriginalWord` records link `strongNumberId → verseId + position`
- Viewing a Strong's entry shows which verses use that word
- Link back to Bible reader at those verses

### Lexicon Search
- Search original language words by Strong's number, lemma, or transliteration
- Results show usage across the Bible with verse links

## 3. Connected Knowledge Graph

### Node Detail Panel
- Click any graph node → slide-out panel with:
  - Entity name, type, group
  - Description (from Person/Place/TimelineEntry record)
  - **Related verses** as clickable links (populated from Gnosis → `EntityRelation.sourceVerseId`)
  - "Read in Bible" button → navigates to first verse reference
  - Connected entities with their verse references

### Subgraph View
- Panel shows a mini-force-graph centered on the selected node (using existing `getEntityGraph` service)
- Can expand to full graph

### Verse→Graph Backlink
- Bible reader shows "Related entities" section per chapter
- Lists people, places, events mentioned in verses of that chapter
- Click → navigate to graph page centered on that entity

## 4. Maps — Biblical Geography

### Data Enrichment
- Import Gnosis/OpenBible place data: 1,200+ places with coordinates
- Link each place to verses where it's mentioned (populate `Place.metadata` or new relation)
- Add region GeoJSON boundaries

### Place Detail Page: `/maps/places/[slug]`
- Map centered on the place with a marker
- Place info: name, type, description, region
- **Verse references**: list of verses mentioning this place
- Nearby places
- Link to knowledge graph for this place

### Journey Detail Page: `/maps/journeys/[id]`
- Render journey path on map with animated polyline
- Stop markers with descriptions
- Person info if linked
- Timeline context

### Map Enhancements
- Search bar for places
- Filter by type (city, region, mountain, body of water)
- Marker clustering at low zoom
- Click marker → show place info + verse references → link to Bible reader

## 5. Seed Data

### New Seed Functions
- `seedCrossReferences()` — import TSK cross-refs from Gnosis/TSK dataset into `CrossReference` table
- `seedEntityVerseLinks()` — populate `EntityRelation.sourceVerseId` from Gnosis people/place→verse data
- `seedOriginalLanguageVerseLinks()` — link Strong's entries to verses via `OriginalWord` records
- `seedExtendedPlaces()` — import 1,200+ places with coordinates from Gnosis
- `seedPlaceVerseLinks()` — populate verse references for places

### Idempotency
- All new seed functions use `deleteMany` before insert (matching existing pattern)
- Skip if data already imported (check row counts)

## 6. Route Changes

| Route | Change |
|-------|--------|
| `/bible/[book]/[chapter]` | Enhanced reader with all new features |
| `/graph/entity/[type]/[id]` | New — entity detail page with verses and connections |
| `/maps/places/[slug]` | New — place detail with map + verses |
| `/maps/places` | New — place browser with search/filter |
| `/maps/journeys/[id]` | New — journey detail with map |
| `/languages/strongs/[id]` | Enhanced — show verse references |
| `/languages/search` | New — lexicon search |

## Scope

This is a large change. Implementation is split into three sub-projects:

1. **Phase A: Bible Reader** — navigation, highlighting, notes, bookmarks, reading progress (core user-facing features)
2. **Phase B: Data Enrichment** — import Gnosis/TSK datasets, seed cross-refs, entity-verse links, extended places
3. **Phase C: Connected Pages** — graph detail panels, place/journey detail pages, original language in-reader, lexicon search

Phases can be built in parallel where dependencies allow.
