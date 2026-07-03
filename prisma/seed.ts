import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"
import { readFileSync } from "fs"

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────

function tiptap(text: string) {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] }
}

function slug(name: string) { return name.toLowerCase().replace(/\s+/g, "-") }

// ─── Constants ────────────────────────────────────────────

const BOOKS_66 = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy",
  "Joshua","Judges","Ruth","1 Samuel","2 Samuel",
  "1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
  "Nehemiah","Esther","Job","Psalms","Proverbs",
  "Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations",
  "Ezekiel","Daniel","Hosea","Joel","Amos",
  "Obadiah","Jonah","Micah","Nahum","Habakkuk",
  "Zephaniah","Haggai","Zechariah","Malachi",
  "Matthew","Mark","Luke","John","Acts",
  "Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians",
  "Philippians","Colossians","1 Thessalonians","2 Thessalonians",
  "1 Timothy","2 Timothy","Titus","Philemon","Hebrews",
  "James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation",
]

// KJV.txt uses different book names for some books
const BOOK_ALIASES: Record<string, string> = {
  "Psalm": "Psalms",
  "Song": "Song of Solomon",
}

const GOSPELS = new Set(["Matthew","Mark","Luke","John"])

// ─── 1. Import KJV ───────────────────────────────────────

async function importKJV() {
  const existingVerses = await prisma.verse.count({ where: { chapter: { book: { translation: { code: "KJV" } } } } })
  if (existingVerses >= 31102) {
    console.log("  📖 KJV already imported, skipping...")
    return
  }

  console.log("  📖 Importing King James Bible...")
  const content = readFileSync("kjv.txt", "utf-8")
  const lines = content.split("\n").filter(l => l.trim())

  const translation = await prisma.translation.upsert({
    where: { code: "KJV" },
    update: { name: "King James Version" },
    create: { code: "KJV", name: "King James Version", isDefault: true },
  })

  const data: { bookName: string; cn: number; vn: number; text: string }[] = []
  for (const line of lines) {
    if (line === "KJV" || line.startsWith("King James Bible")) continue
    const m = line.match(/^(.+?)\s(\d+):(\d+)\t(.+)$/)
    if (!m) continue
    data.push({ bookName: m[1].trim(), cn: parseInt(m[2]), vn: parseInt(m[3]), text: m[4].trim() })
  }

  const books = new Map<string, typeof data>()
  for (const v of data) {
    const arr = books.get(v.bookName) || []
    arr.push(v)
    books.set(v.bookName, arr)
  }

  let totalV = 0
  for (const [bookName, verses] of books) {
    const normalized = BOOK_ALIASES[bookName] || bookName
    const idx = BOOKS_66.indexOf(normalized as any)
    if (idx === -1) { console.error(`  Unknown book: ${bookName}`); continue }

    const book = await prisma.book.upsert({
      where: { translationId_number: { translationId: translation.id, number: idx + 1 } },
      update: {},
      create: { translationId: translation.id, number: idx + 1, name: normalized, testament: idx < 39 ? "OLD" : "NEW" },
    })

    const chapters = new Map<number, typeof verses>()
    for (const v of verses) {
      const arr = chapters.get(v.cn) || []
      arr.push(v)
      chapters.set(v.cn, arr)
    }

    for (const [cn, cverses] of chapters) {
      const chapter = await prisma.chapter.upsert({
        where: { bookId_number: { bookId: book.id, number: cn } },
        update: {},
        create: { bookId: book.id, number: cn },
      })
      for (const v of cverses) {
        const isRed = GOSPELS.has(bookName) && (v.text.startsWith('"') || v.text.startsWith("Jesus said"))
        await prisma.verse.upsert({
          where: { chapterId_number: { chapterId: chapter.id, number: v.vn } },
          update: { text: v.text, isRedLetter: isRed },
          create: { chapterId: chapter.id, number: v.vn, text: v.text, isRedLetter: isRed },
        })
        totalV++
      }
    }
    process.stdout.write(`\r  📚 ${bookName.padEnd(20)}`)
  }
  console.log(`\n  ✅ Imported ${totalV} verses`)
}

// ─── 2. Users ─────────────────────────────────────────────

async function seedUsers() {
  console.log("  👤 Creating users...")
  const adminHash = await hash("ChangeMe123!", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { name: "Admin User", role: "ADMIN" },
    create: { email: "admin@example.com", passwordHash: adminHash, name: "Admin User", role: "ADMIN" },
  })

  const userHash = await hash("ChangeMe123!", 12)
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: { name: "Bible Student", role: "USER" },
    create: { email: "user@example.com", passwordHash: userHash, name: "Bible Student", role: "USER" },
  })

  // Preferences
  for (const u of [admin, user]) {
    await prisma.userPreference.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id, theme: "dark", fontSize: 16, lineSpacing: 1.6, columnWidth: "comfortable" },
    })
  }

  return { admin, user }
}

// ─── 3. Verse Index ───────────────────────────────────────

async function buildVerseIndex() {
  const verses = await prisma.verse.findMany({
    include: { chapter: { include: { book: true } } },
  })
  const idx = new Map<string, string>()
  for (const v of verses) {
    idx.set(`${v.chapter.book.name}|${v.chapter.number}|${v.number}`, v.id)
  }
  return idx
}

// ─── 4. Highlights ────────────────────────────────────────

async function seedHighlights(userId: string, verseIdx: Map<string, string>) {
  console.log("  🖍️  Creating highlights...")
  const DATA = [
    ["Genesis",1,1,"yellow","Creation"],["Genesis",12,1,"blue","Faith"],
    ["Exodus",20,3,"green","Law"],["Leviticus",19,18,"yellow","Love"],
    ["Deuteronomy",6,5,"red","Love"],["Joshua",1,9,"blue","Courage"],
    ["Psalms",23,1,"yellow","Comfort"],["Psalms",23,4,"blue","Peace"],
    ["Psalms",119,105,"green","Wisdom"],["Proverbs",3,5,"yellow","Wisdom"],
    ["Isaiah",53,5,"red","Prophecy"],["Jeremiah",29,11,"blue","Hope"],
    ["Matthew",5,3,"yellow","Kingdom"],["Matthew",5,14,"green","Discipleship"],
    ["Matthew",6,9,"blue","Prayer"],["Matthew",28,19,"red","Missions"],
    ["Mark",10,45,"red","Salvation"],["Luke",2,10,"yellow","Joy"],
    ["Luke",15,11,"green","Forgiveness"],["John",1,1,"red","Christ"],
    ["John",3,16,"red","Salvation"],["John",10,11,"blue","Shepherd"],
    ["John",14,6,"red","Truth"],["Acts",1,8,"yellow","Holy Spirit"],
    ["Acts",2,38,"blue","Repentance"],["Romans",3,23,"red","Sin"],
    ["Romans",6,23,"red","Grace"],["Romans",8,28,"yellow","Hope"],
    ["Romans",12,1,"green","Worship"],["1 Corinthians",13,4,"yellow","Love"],
    ["Galatians",5,22,"green","Fruit"],["Ephesians",2,8,"red","Grace"],
    ["Philippians",4,6,"blue","Peace"],["Hebrews",11,1,"yellow","Faith"],
    ["James",1,2,"green","Wisdom"],["1 Peter",5,7,"blue","Peace"],
    ["Revelation",21,1,"yellow","Hope"],
  ]

  for (const [book, ch, vs, color, tag] of DATA) {
    const vid = verseIdx.get(`${book}|${ch}|${vs}`)
    if (!vid) continue
    await prisma.highlight.upsert({
      where: { userId_verseId: { userId, verseId: vid } },
      update: { color: color as string },
      create: { userId, verseId: vid, color: color as string },
    })
  }
}

// ─── 5. Reading Plan Templates ────────────────────────────

async function seedPlans() {
  console.log("  📋 Creating reading plan templates...")
  const TEMPLATES = [
    { name: "One Year Bible", type: "chronological", days: 365 },
    { name: "Through the New Testament", type: "thematic", days: 90 },
    { name: "Psalms in 30 Days", type: "thematic", days: 30 },
    { name: "Romans Study", type: "thematic", days: 30 },
    { name: "Life of Jesus", type: "chronological", days: 40 },
    { name: "Book of James", type: "thematic", days: 7 },
    { name: "Chronological Reading", type: "chronological", days: 365 },
  ]

  for (const t of TEMPLATES) {
    await prisma.readingPlanTemplate.upsert({
      where: { id: t.name },
      update: {},
      create: { id: t.name, name: t.name, type: t.type, days: t.days, isPublic: true },
    })
  }
  return TEMPLATES
}

// ─── 6. User Reading Plans ────────────────────────────────

async function seedUserPlans(userId: string) {
  console.log("  📖 Creating reading plans for user...")
  const template = await prisma.readingPlanTemplate.findFirst({ where: { type: "thematic" } })
  if (!template) return

  const existing = await prisma.readingPlan.findFirst({ where: { userId, templateId: template.id } })
  if (existing) return

  const plan = await prisma.readingPlan.create({
    data: {
      userId,
      templateId: template.id,
      name: "Through the New Testament",
      type: "thematic",
      startDate: new Date(Date.now() - 30 * 86400000),
    },
  })

  for (let d = 1; d <= 7; d++) {
    await prisma.readingPlanProgress.upsert({
      where: { planId_dayNumber: { planId: plan.id, dayNumber: d } },
      update: { completed: true, completedAt: new Date(Date.now() - (30 - d) * 86400000) },
      create: { planId: plan.id, dayNumber: d, completed: true, completedAt: new Date(Date.now() - (30 - d) * 86400000) },
    })
  }
}

// ─── 7. Prayers ───────────────────────────────────────────

async function seedPrayers(userId: string) {
  console.log("  🙏 Creating prayer entries...")
  const CATEGORIES = ["Family","Friends","Church","Work","Health","Thanksgiving","Guidance","Missions"]

  for (const cat of CATEGORIES) {
    await prisma.prayerCategory.upsert({
      where: { userId_name: { userId, name: cat } },
      update: {},
      create: { userId, name: cat, description: `Prayers about ${cat.toLowerCase()}` },
    })
  }

  const categoryMap = new Map<string, string>()
  const cats = await prisma.prayerCategory.findMany({ where: { userId } })
  for (const c of cats) categoryMap.set(c.name, c.id)

  const PRAYERS = [
    { title:"Family Salvation", content:"Lord, bring my entire family to know You personally.", cat:"Family", answered:false },
    { title:"Marriage Unity", content:"Strengthen my marriage and help us grow together in faith.", cat:"Family", answered:false },
    { title:"Children's Faith", content:"Protect my children and draw them to Yourself.", cat:"Family", answered:false },
    { title:"Parent's Health", content:"Heal and strengthen my aging parents.", cat:"Health", answered:false },
    { title:"Church Leadership", content:"Raise up godly leaders for our congregation.", cat:"Church", answered:false },
    { title:"Youth Ministry", content:"Bless the youth in our church and keep them grounded.", cat:"Church", answered:false },
    { title:"Worship Team", content:"Use our worship to draw people into Your presence.", cat:"Church", answered:true },
    { title:"Friend's Healing", content:"Heal my friend who is battling illness.", cat:"Friends", answered:false },
    { title:"Friend's Salvation", content:"Open my coworker's heart to receive the gospel.", cat:"Friends", answered:false },
    { title:"Friendship Restoration", content:"Restore a broken friendship.", cat:"Friends", answered:true },
    { title:"Work Provision", content:"Provide for our family's financial needs.", cat:"Work", answered:true },
    { title:"Career Direction", content:"Guide me in my career decisions.", cat:"Work", answered:false },
    { title:"Workplace Witness", content:"Help me be a light to my colleagues.", cat:"Work", answered:false },
    { title:"Healing from Surgery", content:"Complete recovery after my surgery.", cat:"Health", answered:true },
    { title:"Mental Health", content:"Peace for my anxious thoughts.", cat:"Health", answered:false },
    { title:"Thank You for Grace", content:"Thank You for saving me by grace through faith.", cat:"Thanksgiving", answered:true },
    { title:"Thank You for Family", content:"Grateful for my family's love and support.", cat:"Thanksgiving", answered:true },
    { title:"Thank You for Church", content:"Thank You for our church community.", cat:"Thanksgiving", answered:true },
    { title:"Missionary Support", content:"Protect and provide for our missionaries overseas.", cat:"Missions", answered:false },
    { title:"Local Outreach", content:"Open doors for sharing the gospel in our community.", cat:"Missions", answered:false },
    { title:"Global Revival", content:"Send revival across the nations.", cat:"Missions", answered:false },
    { title:"Wisdom for Decisions", content:"Give me wisdom for the decision ahead.", cat:"Guidance", answered:false },
    { title:"Next Steps", content:"Show me the path You have for me.", cat:"Guidance", answered:false },
    { title:"Bible Reading Plan", content:"Help me stay consistent in Your Word.", cat:"Guidance", answered:false },
    { title:"Patience", content:"Teach me patience in difficult circumstances.", cat:"Guidance", answered:false },
    { title:"Finances", content:"Help us be wise stewards of what You've given.", cat:"Work", answered:false },
    { title:"Holiday Peace", content:"Peace and joy for our family gathering.", cat:"Family", answered:true },
    { title:"New Believers", content:"Help new believers grow in their faith.", cat:"Church", answered:false },
    { title:"Deliverance", content:"Break the chains of addiction in my life.", cat:"Health", answered:true },
    { title:"Grief Comfort", content:"Comfort those who are mourning.", cat:"Friends", answered:false },
  ]

  for (const p of PRAYERS) {
    const catId = categoryMap.get(p.cat)
    await prisma.prayerRequest.create({
      data: {
        userId,
        title: p.title,
        content: p.content,
        categoryId: catId,
        isAnswered: p.answered,
        answeredAt: p.answered ? new Date(Date.now() - Math.random() * 30 * 86400000) : null,
      },
    })
  }
}

// ─── 8. Notes ─────────────────────────────────────────────

async function seedNotes(userId: string, verseIdx: Map<string, string>) {
  console.log("  📝 Creating study notes...")

  const NOTETEXTS = [
    // Pentateuch (15)
    ["The creation account establishes God as the sovereign Creator. The Hebrew 'bara' (create) is used exclusively for divine activity.", "Genesis|1|1"],
    ["Adam and Eve's fall shows the devastating impact of sin. The Hebrew 'cherubim' with flaming swords guard Eden's entrance.", "Genesis|3|1"],
    ["God's covenant with Abraham in Genesis 12 marks a turning point. All nations would be blessed through him — fulfilled in Christ.", "Genesis|12|1"],
    ["Abraham's willingness to sacrifice Isaac foreshadows God the Father offering His own Son.", "Genesis|22|1"],
    ["Jacob's wrestling with God at Peniel transforms him. He walks with a limp — a reminder that encountering God leaves marks.", "Genesis|32|24"],
    ["Joseph's story demonstrates God's sovereignty over evil. 'You intended to harm me, but God intended it for good.'", "Genesis|50|20"],
    ["The burning bush encounter reveals God's holiness. Moses removes his sandals on holy ground.", "Exodus|3|1"],
    ["The ten plagues systematically defeated Egypt's gods. The Passover lamb prefigures Christ.", "Exodus|12|1"],
    ["The Ten Commandments form the moral foundation. Jesus summarized them as love for God and neighbor.", "Exodus|20|1"],
    ["The Tabernacle shows God dwelling among His people. Every detail points to Christ.", "Exodus|25|1"],
    ["The Day of Atonement (Yom Kippur) foreshadows Christ's once-for-all sacrifice.", "Leviticus|16|1"],
    ["Be holy as I am holy — Leviticus calls God's people to distinctive living.", "Leviticus|19|1"],
    ["The wilderness wanderings remind us that unbelief prevents entering God's rest.", "Numbers|14|1"],
    ["'Hear O Israel, the Lord our God, the Lord is One' — the Shema is Israel's great confession.", "Deuteronomy|6|4"],
    ["God's faithful love endures. Deuteronomy emphasizes covenant loyalty and blessing.", "Deuteronomy|7|1"],
    // History (10)
    ["Joshua leads Israel into the Promised Land. 'Be strong and courageous' — God's command repeated throughout.", "Joshua|1|9"],
    ["The walls of Jericho fell by faith, not military might. Obedience precedes victory.", "Joshua|6|1"],
    ["Gideon's 300 men defeat Midian — God uses the weak to shame the strong.", "Judges|7|1"],
    ["Ruth's loyalty to Naomi demonstrates hesed (covenant faithfulness). A beautiful redemption story.", "Ruth|1|16"],
    ["David and Goliath shows that the battle is the Lord's. Five smooth stones and unwavering faith.", "1 Samuel|17|1"],
    ["David's repentance after sin with Bathsheba shows God's grace to the broken.", "Psalms|51|1"],
    ["Solomon's prayer of dedication at the Temple — God's presence fills the house.", "1 Kings|8|1"],
    ["Elijah on Mount Carmel proves Yahweh alone is God. Fire from heaven consumes the sacrifice.", "1 Kings|18|1"],
    ["Hezekiah's reforms brought revival. When leadership returns to God's Word, blessing follows.", "2 Kings|18|1"],
    ["Nehemiah rebuilds Jerusalem's walls. Prayer + planning + persistence = God's work accomplished.", "Nehemiah|2|1"],
    // Wisdom (10)
    ["Job's suffering tests his faith. 'Though He slay me, yet will I trust Him.' God's ways are beyond our understanding.", "Job|13|15"],
    ["The Lord is my Shepherd — intimate relationship with God. Green pastures, still waters, restored soul.", "Psalms|23|1"],
    ["Create in me a clean heart — genuine repentance after failure. David's plea echoes our need for grace.", "Psalms|51|10"],
    ["Your word is a lamp to my feet — Scripture guides daily steps. Meditate on it day and night.", "Psalms|119|105"],
    ["The heavens declare the glory of God — general revelation points to the Creator.", "Psalms|19|1"],
    ["Trust in the Lord with all your heart — not leaning on our own understanding acknowledges God's superior wisdom.", "Proverbs|3|5"],
    ["The fear of the Lord is the beginning of wisdom. Reverence for God is the foundation of knowledge.", "Proverbs|9|10"],
    ["A gentle answer turns away wrath — practical wisdom for relationships.", "Proverbs|15|1"],
    ["To everything there is a season — God's sovereignty over time and circumstances.", "Ecclesiastes|3|1"],
    ["Love is as strong as death — the Song celebrates marital love as a picture of God's love.", "Song of Solomon|8|6"],
    // Prophets (10)
    ["Isaiah's vision of God's holiness — 'Woe is me, for I am undone.' Cleansing and calling.", "Isaiah|6|1"],
    ["The suffering Servant — Isaiah 53 foretells Christ's atoning death 700 years before Calvary.", "Isaiah|53|1"],
    ["God's thoughts are higher than ours — His ways transcend human understanding.", "Isaiah|55|8"],
    ["New covenant prophecy — God will write His law on hearts, not stone.", "Jeremiah|31|31"],
    ["Plans to prosper you — God's heart for His people even in exile.", "Jeremiah|29|11"],
    ["Ezekiel's vision of dry bones — God can restore what seems dead beyond hope.", "Ezekiel|37|1"],
    ["Daniel in the lions' den — integrity under pressure. God shuts the mouths of lions.", "Daniel|6|1"],
    ["'I desire mercy, not sacrifice' — God's heart for genuine relationship over ritual.", "Hosea|6|6"],
    ["'Everyone who calls on the name of the Lord will be saved' — the promise of Pentecost.", "Joel|2|32"],
    ["He has shown you what is good — to act justly, love mercy, walk humbly with God.", "Micah|6|8"],
    // Gospels (15)
    ["The Beatitudes reorient values — blessed are the poor in spirit, the mourners, the meek.", "Matthew|5|3"],
    ["The Lord's Prayer models intimacy with God. 'Our Father' — relationship, 'Hallowed be Your name' — reverence.", "Matthew|6|9"],
    ["The Great Commission — make disciples of all nations. Our marching orders until His return.", "Matthew|28|19"],
    ["The parable of the sower — four soils, one seed. The condition of the heart determines fruitfulness.", "Matthew|13|1"],
    ["'Come to me, all you who are weary' — the invitation to rest in Christ.", "Matthew|11|28"],
    ["The Son of Man came to serve, not to be served — the upside-down kingdom values.", "Mark|10|45"],
    ["Love the Lord your God with all your heart — the greatest commandment summarized.", "Mark|12|30"],
    ["The Magnificat — Mary's song of praise. 'My soul magnifies the Lord.'", "Luke|1|46"],
    ["The Prodigal Son — the Father's extravagant love. He runs to embrace the returning sinner.", "Luke|15|11"],
    ["Zacchaeus — salvation comes to the unlikely. Jesus seeks and saves the lost.", "Luke|19|1"],
    ["In the beginning was the Word — John's cosmic introduction of Christ as eternal Logos.", "John|1|1"],
    ["God so loved the world — the most famous verse captures the gospel in a nutshell.", "John|3|16"],
    ["I am the way, the truth, and the life — Jesus' exclusive claim to be the only path to the Father.", "John|14|6"],
    ["I am the Good Shepherd — Jesus knows His sheep and lays down His life for them.", "John|10|11"],
    ["Jesus wept — the shortest verse shows Christ's compassion in the face of death.", "John|11|35"],
    // Acts + Epistles (15)
    ["Pentecost — the Spirit comes with power. Tongues of fire, rushing wind, transformed disciples.", "Acts|2|1"],
    ["'Silver and gold I do not have, but what I have I give you' — in Jesus' name, rise and walk.", "Acts|3|6"],
    ["Stephen's martyrdom — 'Lord, do not hold this sin against them.' Dying like his Master.", "Acts|7|59"],
    ["Paul's conversion on the Damascus road — the greatest turnaround in church history.", "Acts|9|1"],
    ["All have sinned and fall short — the universal need for salvation through faith.", "Romans|3|23"],
    ["The wages of sin is death, but the gift of God is eternal life — gospel in one verse.", "Romans|6|23"],
    ["All things work together for good — God's sovereignty over suffering for those who love Him.", "Romans|8|28"],
    ["Present your bodies as a living sacrifice — total surrender as true worship.", "Romans|12|1"],
    ["Love is patient, love is kind — the most beautiful description of love ever written.", "1 Corinthians|13|4"],
    ["It is for freedom that Christ set us free — stand firm in gospel liberty.", "Galatians|5|1"],
    ["The fruit of the Spirit — the character of Christ formed in us by the Holy Spirit.", "Galatians|5|22"],
    ["By grace you have been saved through faith — salvation is God's gift, not our work.", "Ephesians|2|8"],
    ["Rejoice in the Lord always — Paul writes this from prison. Joy transcends circumstances.", "Philippians|4|4"],
    ["Faith is the assurance of things hoped for — the great hall of faith in Hebrews 11.", "Hebrews|11|1"],
    ["Faith without works is dead — genuine faith produces action. Prove your faith by your deeds.", "James|2|17"],
  ]

  // Distribute notes across the verse index — pick actual existing verse IDs
  const verseEntries = [...verseIdx.entries()]
  let noteCount = 0

  for (const [text, ref] of NOTETEXTS) {
    const vid = verseIdx.get(ref)
    if (!vid) continue
    const title = text.split(".")[0].slice(0, 60)
    await prisma.note.create({
      data: {
        userId,
        verseId: vid,
        title,
        content: tiptap(text) as any,
        tags: [],
        linksTo: [],
      },
    })
    noteCount++
  }
  console.log(`  ✅ Created ${noteCount} notes`)
}

// ─── 9. Bookmark Reading History ─────────────────────────

async function seedBookmarksAndHistory(userId: string, verseIdx: Map<string, string>) {
  console.log("  🔖 Creating bookmarks...")
  const BOOKMARKS = [
    "Genesis|1|1","Psalms|23|1","Isaiah|53|1","Matthew|5|1","John|3|16",
    "Acts|2|1","Romans|8|1","Ephesians|2|1","Philippians|4|1","James|1|1","Revelation|21|1",
    "Genesis|12|1","Exodus|20|1","Psalms|119|105","Proverbs|3|5","Jeremiah|29|11",
    "Matthew|28|19","John|1|1","Romans|6|23","1 Corinthians|13|1","Hebrews|11|1",
  ]
  for (const ref of BOOKMARKS) {
    const vid = verseIdx.get(ref)
    if (!vid) continue
    await prisma.highlight.upsert({
      where: { userId_verseId: { userId, verseId: vid } },
      update: {},
      create: { userId, verseId: vid, color: "blue" },
    })
  }
}

// ─── 10. Maps ─────────────────────────────────────────────

async function seedMaps() {
  console.log("  🗺️  Creating map data...")
  const REGIONS = [
    { name:"Galilee", regionType:"region" },
    { name:"Judea", regionType:"region" },
    { name:"Asia Minor", regionType:"region" },
    { name:"Greece", regionType:"region" },
    { name:"Egypt", regionType:"region" },
  ]
  const regionMap = new Map<string, string>()
  for (const r of REGIONS) {
    const reg = await prisma.region.upsert({
      where: { id: r.name }, update: {},
      create: { id: r.name, name: r.name, regionType: r.regionType },
    })
    regionMap.set(r.name, reg.id)
  }

  const PLACES = [
    ["Jerusalem",31.7683,35.2137,"city","Judea","Capital of ancient Israel"],
    ["Bethlehem",31.7054,35.2024,"city","Judea","Birthplace of Jesus"],
    ["Nazareth",32.6996,35.3035,"city","Galilee","Hometown of Jesus"],
    ["Capernaum",32.8800,35.5750,"city","Galilee","Center of Jesus' ministry"],
    ["Jericho",31.8570,35.4444,"city","Judea","Ancient city conquered by Joshua"],
    ["Jordan River",32.1000,35.5500,"landmark",null,"Major river of Israel"],
    ["Mount Sinai",28.5392,33.9753,"landmark","Egypt","Where Moses received the Law"],
    ["Damascus",33.5131,36.3092,"city",null,"Ancient Syrian city"],
    ["Athens",37.9838,23.7275,"city","Greece","Paul addressed the Areopagus"],
    ["Rome",41.9028,12.4964,"city",null,"Capital of the Roman Empire"],
    ["Ephesus",37.9395,27.3415,"city","Asia Minor","Major early church center"],
    ["Corinth",37.9381,22.9327,"city","Greece","Paul planted a church here"],
    ["Philippi",41.0124,24.3446,"city","Greece","First European church"],
    ["Antioch",36.2000,36.1500,"city","Asia Minor","Early Christian center"],
    ["Galilee",32.7500,35.5000,"region",null,"Region of northern Israel"],
  ]

  for (const [name, lat, lng, type, region, desc] of PLACES) {
    await prisma.place.upsert({
      where: { id: slug(name as string) },
      update: {},
      create: {
        id: slug(name as string),
        name: name as string,
        latitude: lat as number,
        longitude: lng as number,
        placeType: type as string,
        regionId: region ? regionMap.get(region as string) : null,
        description: desc as string,
      },
    })
  }
}

// ─── 11. Timeline ─────────────────────────────────────────

async function seedTimeline() {
  console.log("  📅 Creating timeline...")
  const PERIODS = [
    ["Creation","The beginning of all things",-4000,-2000,1],
    ["Patriarchs","Abraham, Isaac, Jacob",-2000,-1800,2],
    ["Exodus","Moses and the deliverance from Egypt",-1446,-1406,3],
    ["Conquest","Joshua leads Israel into Canaan",-1406,-1375,4],
    ["Judges","Cycles of sin and deliverance",-1375,-1050,5],
    ["United Kingdom","Saul, David, Solomon",-1050,-930,6],
    ["Divided Kingdom","Israel and Judah",-930,-586,7],
    ["Exile","Babylonian captivity",-586,-539,8],
    ["Return","Rebuilding Jerusalem",-539,-400,9],
    ["Intertestamental","Silent years",-400,-5,10],
    ["Gospels","Life of Christ",-5,33,11],
    ["Early Church","Acts and the Apostles",33,100,12],
  ]

  for (const [name, desc, start, end, order] of PERIODS) {
    await prisma.period.upsert({
      where: { id: slug(name as string) },
      update: {},
      create: { id: slug(name as string), name: name as string, description: desc as string, startYear: start as number, endYear: end as number, order: order as number },
    })
  }

  const EVENTS = [
    ["Creation",-4000,null,"creation","God creates the heavens and the earth"],
    ["Flood",-2500,null,"creation","Noah and the great flood"],
    ["Call of Abraham",-2000,null,"patriarchs","God calls Abram from Ur"],
    ["Isaac Born",-1900,null,"patriarchs","Son of promise born to Abraham and Sarah"],
    ["Joseph in Egypt",-1800,null,"patriarchs","Joseph sold into slavery, rises to power"],
    ["Exodus from Egypt",-1446,null,"exodus","Moses leads Israel out of slavery"],
    ["Ten Commandments",-1446,null,"exodus","God gives the Law at Sinai"],
    ["Conquest of Canaan",-1406,null,"conquest","Joshua leads Israel into the Promised Land"],
    ["David Anointed King",-1025,null,"united-kingdom","Samuel anoints David as king"],
    ["Solomon's Temple",-966,null,"united-kingdom","First Temple built in Jerusalem"],
    ["Kingdom Divided",-930,null,"divided-kingdom","Israel splits into north and south"],
    ["Fall of Samaria",-722,null,"divided-kingdom","Assyria conquers northern kingdom"],
    ["Fall of Jerusalem",-586,null,"exile","Babylon destroys the Temple"],
    ["Return from Exile",-538,null,"return","Cyrus allows Jews to return"],
    ["Second Temple",-516,null,"return","Temple rebuilt under Zerubbabel"],
    ["Birth of Jesus",-5,null,"gospels","Christ is born in Bethlehem"],
    ["Jesus Begins Ministry",27,null,"gospels","Jesus baptized, begins preaching"],
    ["Crucifixion",33,null,"gospels","Jesus dies on the cross"],
    ["Resurrection",33,null,"gospels","Jesus rises from the dead"],
    ["Pentecost",33,null,"early-church","Holy Spirit descends, church begins"],
    ["Paul's Conversion",35,null,"early-church","Saul encounters Christ on Damascus road"],
    ["First Missionary Journey",46,null,"early-church","Paul and Barnabas sent out"],
    ["Jerusalem Council",50,null,"early-church","Gentiles welcomed without Law"],
    ["Paul Arrested in Jerusalem",57,null,"early-church","Paul's final visit to Jerusalem"],
    ["Paul in Rome",60,null,"early-church","Paul under house arrest, writes epistles"],
    ["Revelation Written",95,null,"early-church","John receives Revelation on Patmos"],
  ]

  // Clear existing entries so re-runs stay clean
  await prisma.timelineEntry.deleteMany()

  const periodIdx = new Map<string, string>()
  const periods = await prisma.period.findMany()
  for (const p of periods) periodIdx.set(slug(p.name), p.id)

  for (const [title, year, _, entityType, desc] of EVENTS) {
    const periodId = periodIdx.get(entityType as string)
    await prisma.timelineEntry.create({
      data: {
        title: title as string,
        description: desc as string,
        startYear: year as number,
        periodId,
        entityType: entityType as string,
        importance: 5,
        verseIds: [],
      },
    })
  }
}

// ─── 12. Knowledge Graph ─────────────────────────────────

async function seedBiblicalFigures() {
  const FIGURES = [
    ["Abraham", "patriarch", "Father of the nation of Israel"],
    ["Isaac", "patriarch", "Son of Abraham, father of Jacob"],
    ["Jacob", "patriarch", "Father of the twelve tribes"],
    ["Joseph", "patriarch", "Sold into Egypt, rose to power"],
    ["Moses", "prophet", "Led Israel out of Egypt"],
    ["Noah", "patriarch", "Built the ark, survived the flood"],
    ["Samuel", "prophet", "Last judge, anointed Saul and David"],
    ["David", "king", "Second king of Israel"],
    ["Solomon", "king", "Third king of Israel, built the Temple"],
    ["Isaiah", "prophet", "Major prophet of Judah"],
    ["Jeremiah", "prophet", "Prophet of the exile"],
    ["Peter", "apostle", "Chief apostle, wrote 1-2 Peter"],
    ["John", "apostle", "Beloved disciple, wrote John-Revelation"],
    ["Paul", "apostle", "Apostle to the Gentiles"],
    ["Mary", "disciple", "Mother of Jesus"],
    ["Jesus", "historical", "Son of God, Savior"],
  ]
  for (const [name, type, desc] of FIGURES) {
    await prisma.person.upsert({
      where: { id: slug(name as string) },
      update: {},
      create: { id: slug(name as string), name: name as string, personType: type as string, description: desc as string },
    })
  }
}

async function seedKnowledgeGraph() {
  console.log("  🔗 Creating knowledge graph...")

  // Clear existing relations so re-runs stay clean
  await prisma.entityRelation.deleteMany()

  // Build name-to-ID maps from actual records
  const persons = await prisma.person.findMany()
  const personMap = new Map(persons.map((p) => [slug(p.name), p.id]))
  const places = await prisma.place.findMany()
  const placeMap = new Map(places.map((p) => [slug(p.name), p.id]))
  const events = await prisma.timelineEntry.findMany()
  const eventMap = new Map(events.map((e) => [slug(e.title), e.id]))

  const RELATIONS = [
    // ── Family ──
    ["father_of","person","Abraham","person","Isaac"],
    ["father_of","person","Isaac","person","Jacob"],
    ["father_of","person","Jacob","person","Joseph"],
    ["mother_of","person","Mary","person","Jesus"],
    // ── Discipleship ──
    ["disciple_of","person","Peter","person","Jesus"],
    ["disciple_of","person","John","person","Jesus"],
    ["disciple_of","person","Paul","person","Jesus"],
    // ── Travel / Geography ──
    ["wrote","person","Paul","place","Rome"],
    ["traveled_to","person","Paul","place","Damascus"],
    ["traveled_to","person","Paul","place","Athens"],
    ["traveled_to","person","Paul","place","Corinth"],
    ["traveled_to","person","Paul","place","Ephesus"],
    ["traveled_to","person","Paul","place","Rome"],
    ["traveled_to","person","Jesus","place","Nazareth"],
    ["traveled_to","person","Jesus","place","Capernaum"],
    ["traveled_to","person","Jesus","place","Jerusalem"],
    ["traveled_to","person","Jesus","place","Bethlehem"],
    ["born_in","person","Jesus","place","Bethlehem"],
    ["raised_in","person","Jesus","place","Nazareth"],
    // ── Prophecy (events linked to prophets) ──
    ["prophesied","event","creation","person","Isaiah"],
    ["prophesied","event","flood","person","Noah"],
    ["prophesied","event","exodus-from-egypt","person","Moses"],
    ["prophesied","event","david-anointed-king","person","Samuel"],
    ["prophesied","event","birth-of-jesus","person","Isaiah"],
    ["prophesied","event","crucifixion","person","Isaiah"],
    ["prophesied","event","fall-of-jerusalem","person","Jeremiah"],
  ]

  let created = 0
  for (const [predicate, sType, sName, oType, oName] of RELATIONS) {
    const subjectId = sType === "person" ? personMap.get(slug(sName as string)) : sType === "place" ? placeMap.get(slug(sName as string)) : sType === "event" ? eventMap.get(slug(sName as string)) : slug(sName as string)
    const objectId = oType === "person" ? personMap.get(slug(oName as string)) : oType === "place" ? placeMap.get(slug(oName as string)) : oType === "event" ? eventMap.get(slug(oName as string)) : slug(oName as string)
    if (!subjectId || !objectId) {
      console.warn(`  ⚠️  Skipping relation ${predicate}: ${sType} '${sName}' (${subjectId ?? "not found"}) -> ${oType} '${oName}' (${objectId ?? "not found"})`)
      continue
    }
    await prisma.entityRelation.create({
      data: {
        subjectId,
        subjectType: sType as string,
        predicate: predicate as string,
        objectId,
        objectType: oType as string,
      },
    })
    created++
  }
  console.log(`  ✅ Created ${created} relations`)
}

// ─── 13. Cross-References ────────────────────────────────

async function seedCrossReferences() {
  const xrefCount = await prisma.crossReference.count()
  if (xrefCount > 0) {
    console.log(`  🔗 Skipping Gnosis import — ${xrefCount} cross-references already exist`)
    return
  }

  console.log("  🔗 Importing Gnosis dataset (cross-references, places, entity→verse links)...")
  try {
    const { execSync } = require("child_process")
    execSync("npx tsx scripts/import-gnosis.ts", { stdio: "inherit" })
    console.log("  ✅ Gnosis import complete")
  } catch (e) {
    console.error("  ⚠️  Gnosis import failed (non-fatal):", (e as Error).message)
  }
}

// ─── 14. Original Languages Demo ─────────────────────────

async function seedOriginalLanguages() {
  console.log("  📜 Creating original language demo data...")

  const HEBREW = [
    ["H7225","hebrew","רֵאשִׁית","reshith","beginning, first-fruit"],
    ["H430","hebrew","אֱלֹהִים","elohim","God, gods, judges"],
    ["H1254","hebrew","בָּרָא","bara","to create, make"],
    ["H8064","hebrew","שָׁמַיִם","shamayim","heaven, heavens, sky"],
    ["H776","hebrew","אֶרֶץ","erets","earth, land, ground"],
    ["H1961","hebrew","הָיָה","hayah","to be, become, come to pass"],
    ["H216","hebrew","אוֹר","or","light"],
    ["H2896","hebrew","טוֹב","tov","good, pleasant, agreeable"],
    ["H3117","hebrew","יוֹם","yom","day"],
    ["H3915","hebrew","לַיִל","layil","night"],
    ["H4325","hebrew","מַיִם","mayim","water, waters"],
    ["H7307","hebrew","רוּחַ","ruach","breath, wind, spirit"],
    ["H5315","hebrew","נֶפֶשׁ","nephesh","soul, living being"],
    ["H1288","hebrew","בָרַךְ","barak","to bless, kneel"],
    ["H2398","hebrew","חָטָא","chata","to sin, miss the mark"],
    ["H6662","hebrew","צַדִּיק","tsaddiq","righteous, just"],
    ["H2617","hebrew","חֶסֶד","chesed","lovingkindness, mercy"],
    ["H5307","hebrew","נָפַל","naphal","to fall, lie"],
    ["H3467","hebrew","יָשַׁע","yasha","to save, deliver"],
    ["H1696","hebrew","דָּבַר","dabar","to speak, declare"],
  ]

  const GREEK = [
    ["G3056","greek","λόγος","logos","word, reason, account"],
    ["G2316","greek","θεός","theos","God"],
    ["G2962","greek","κύριος","kurios","Lord, master"],
    ["G5547","greek","Χριστός","christos","Christ, anointed one"],
    ["G2424","greek","Ἰησοῦς","iesous","Jesus"],
    ["G5207","greek","υἱός","huios","son"],
    ["G4100","greek","πιστεύω","pisteuo","to believe, trust"],
    ["G26","greek","ἀγάπη","agape","love"],
    ["G2192","greek","ἔχω","echo","to have, hold"],
    ["G3588","greek","ὁ","ho","the (definite article)"],
    ["G1510","greek","εἰμί","eimi","to be, exist"],
    ["G3779","greek","οὕτως","houtos","thus, so, in this way"],
    ["G2889","greek","κόσμος","kosmos","world, universe"],
    ["G1325","greek","δίδωμι","didomi","to give"],
    ["G165","greek","αἰών","aion","age, eternity"],
    ["G2222","greek","ζωή","zoe","life"],
    ["G622","greek","ἀπόλλυμι","apollumi","to destroy, perish"],
    ["G3306","greek","μένω","meno","to remain, abide"],
    ["G4151","greek","πνεῦμα","pneuma","spirit, wind, breath"],
    ["G225","greek","ἀλήθεια","aletheia","truth"],
  ]

  for (const [num, lang, text, translit, def] of HEBREW) {
    const strong = await prisma.strongNumber.upsert({
      where: { number: num as string },
      update: { lemma: translit as string, transliteration: translit as string, definition: def as string, language: lang as string },
      create: { number: num as string, language: lang as string, lemma: translit as string, transliteration: translit as string, definition: def as string },
    })
    await prisma.originalWord.upsert({
      where: { id: `${num}-word` },
      update: {},
      create: { id: `${num}-word`, strongNumberId: strong.id, text: text as string, lemma: translit as string, language: lang as string },
    })
    await prisma.lexicalEntry.upsert({
      where: { lemma: translit as string },
      update: { language: lang as string, definition: def as string },
      create: { lemma: translit as string, language: lang as string, definition: def as string, synonyms: [], antonyms: [] },
    })
  }

  for (const [num, lang, text, translit, def] of GREEK) {
    const strong = await prisma.strongNumber.upsert({
      where: { number: num as string },
      update: { lemma: translit as string, transliteration: translit as string, definition: def as string, language: lang as string },
      create: { number: num as string, language: lang as string, lemma: translit as string, transliteration: translit as string, definition: def as string },
    })
    await prisma.originalWord.upsert({
      where: { id: `${num}-word` },
      update: {},
      create: { id: `${num}-word`, strongNumberId: strong.id, text: text as string, lemma: translit as string, language: lang as string },
    })
    await prisma.lexicalEntry.upsert({
      where: { lemma: translit as string },
      update: { language: lang as string, definition: def as string },
      create: { lemma: translit as string, language: lang as string, definition: def as string, synonyms: [], antonyms: [] },
    })
  }
}

// ─── 14. Feature Toggles ──────────────────────────────────

async function seedFeatures() {
  const FEATURES = [
    ["ai.rag.enabled", true, "Enable RAG pipeline"],
    ["ai.citation-engine", true, "Enable citation enforcement"],
    ["maps.enabled", true, "Enable maps module"],
    ["timeline.enabled", true, "Enable timeline module"],
    ["knowledge-graph.enabled", true, "Enable knowledge graph"],
  ]
  for (const [key, enabled, desc] of FEATURES) {
    await prisma.featureToggle.upsert({
      where: { key: key as string },
      update: { enabled: enabled as boolean },
      create: { key: key as string, enabled: enabled as boolean, description: desc as string },
    })
  }
}

// ─── 15. DailyVerse ───────────────────────────────────────

async function seedDailyVerse(verseIdx: Map<string, string>) {
  const VERSES = [
    ["Psalms|118|24","This is the day the Lord has made; let us rejoice and be glad in it."],
    ["Psalms|23|1","The Lord is my shepherd; I shall not want."],
    ["Philippians|4|13","I can do all things through Christ who strengthens me."],
    ["Jeremiah|29|11","For I know the plans I have for you, declares the Lord."],
    ["John|3|16","For God so loved the world that He gave His only begotten Son."],
    ["Romans|8|28","All things work together for good to those who love God."],
    ["2 Corinthians|5|17","If anyone is in Christ, he is a new creation."],
  ]

  for (let i = 0; i < VERSES.length; i++) {
    const [ref, text] = VERSES[i]
    const vid = verseIdx.get(ref as string)
    if (!vid) continue
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    await prisma.dailyVerse.upsert({
      where: { date },
      update: { devotional: text as string },
      create: { verseId: vid, date, devotional: text as string },
    })
  }
}

// ─── 16. AIModelConfig ────────────────────────────────────

async function seedAIConfig() {
  const TASKS = [
    ["verse_explanation","opencode-zen","default",0.3,500],
    ["passage_summary","opencode-zen","default",0.3,800],
    ["theological_question_answering","opencode-zen","default",0.4,1000],
    ["devotional_generation","opencode-zen","default",0.7,800],
    ["study_plan_generation","opencode-zen","default",0.5,1000],
  ]
  for (const [task, provider, model, temp, tokens] of TASKS) {
    await prisma.aIModelConfig.upsert({
      where: { taskType: task as string },
      update: {},
      create: { taskType: task as string, provider: provider as string, model: model as string, temperature: temp as number, maxTokens: tokens as number },
    })
  }
}

// ─── MAIN ─────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 BibleHub AI — Seed Script\n")
  const startTime = Date.now()

  await importKJV()
  const { admin, user } = await seedUsers()
  const verseIdx = await buildVerseIndex()
  await seedHighlights(user.id, verseIdx)
  await seedPlans()
  await seedUserPlans(user.id)
  await seedPrayers(user.id)
  await seedNotes(user.id, verseIdx)
  await seedBookmarksAndHistory(user.id, verseIdx)
  await seedMaps()
  await seedTimeline()
  await seedBiblicalFigures()
  await seedKnowledgeGraph()
  await seedCrossReferences()
  await seedOriginalLanguages()
  await seedFeatures()
  await seedDailyVerse(verseIdx)
  await seedAIConfig()

  // ─── Verification ──────────────────────────────────────
  const userCount = await prisma.user.count()
  const bookCount = await prisma.book.count({ where: { translation: { code: "KJV" } } })
  const chapterCount = await prisma.chapter.count({ where: { book: { translation: { code: "KJV" } } } })
  const verseCount = await prisma.verse.count({ where: { chapter: { book: { translation: { code: "KJV" } } } } })
  const noteCount = await prisma.note.count({ where: { userId: user.id } })
  const highlightCount = await prisma.highlight.count({ where: { userId: user.id } })
  const prayerCount = await prisma.prayerRequest.count()
  const placeCount = await prisma.place.count()
  const eventCount = await prisma.timelineEntry.count()
  const duration = ((Date.now() - startTime) / 1000).toFixed(1)

  // Verify critical thresholds
  const errors: string[] = []
  if (bookCount !== 66) errors.push(`Expected 66 books, got ${bookCount}`)
  if (verseCount < 31102) errors.push(`Expected 31102+ verses, got ${verseCount}`)
  if (userCount < 2) errors.push(`Expected 2 users, got ${userCount}`)
  if (noteCount < 75) errors.push(`Expected 75+ notes, got ${noteCount}`)
  if (prayerCount < 20) errors.push(`Expected 20+ prayers, got ${prayerCount}`)
  if (placeCount < 10) errors.push(`Expected 10+ places, got ${placeCount}`)
  if (eventCount < 10) errors.push(`Expected 10+ timeline events, got ${eventCount}`)

  console.log(`\n📊 Seed Complete`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  Users:       ${userCount}`)
  console.log(`  Books:       ${bookCount}/66`)
  console.log(`  Chapters:    ${chapterCount}`)
  console.log(`  Verses:      ${verseCount}`)
  console.log(`  Notes:       ${noteCount}`)
  console.log(`  Highlights:  ${highlightCount}`)
  console.log(`  Prayers:     ${prayerCount}`)
  console.log(`  Places:      ${placeCount}`)
  console.log(`  Events:      ${eventCount}`)
  console.log(`  Duration:    ${duration}s`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━`)

  if (errors.length > 0) {
    console.log(`\n❌ Verification errors:`)
    for (const e of errors) console.log(`  • ${e}`)
    process.exit(1)
  }

  console.log(`\n✅ All checks passed!\n`)
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
