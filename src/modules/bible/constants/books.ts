export const BOOKS_66 = [
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
] as const

export const GOSPELS = new Set(["Matthew", "Mark", "Luke", "John"])

export const BOOK_ABBREVIATIONS: Record<string, string> = {
  Genesis: "Gen", Exodus: "Ex", Leviticus: "Lev", Numbers: "Num",
  Deuteronomy: "Deut", Joshua: "Josh", Judges: "Judg", Ruth: "Ruth",
  "1 Samuel": "1 Sam", "2 Samuel": "2 Sam", "1 Kings": "1 Kings",
  "2 Kings": "2 Kings", "1 Chronicles": "1 Chron", "2 Chronicles": "2 Chron",
  Ezra: "Ezra", Nehemiah: "Neh", Esther: "Est", Job: "Job",
  Psalms: "Ps", Proverbs: "Prov", Ecclesiastes: "Eccl",
  "Song of Solomon": "Song", Isaiah: "Isa", Jeremiah: "Jer",
  Lamentations: "Lam", Ezekiel: "Ezek", Daniel: "Dan", Hosea: "Hos",
  Joel: "Joel", Amos: "Amos", Obadiah: "Obad", Jonah: "Jonah",
  Micah: "Mic", Nahum: "Nah", Habakkuk: "Hab", Zephaniah: "Zeph",
  Haggai: "Hag", Zechariah: "Zech", Malachi: "Mal",
  Matthew: "Matt", Mark: "Mark", Luke: "Luke", John: "John",
  Acts: "Acts", Romans: "Rom", "1 Corinthians": "1 Cor",
  "2 Corinthians": "2 Cor", Galatians: "Gal", Ephesians: "Eph",
  Philippians: "Phil", Colossians: "Col", "1 Thessalonians": "1 Thess",
  "2 Thessalonians": "2 Thess", "1 Timothy": "1 Tim", "2 Timothy": "2 Tim",
  Titus: "Titus", Philemon: "Philem", Hebrews: "Heb", James: "James",
  "1 Peter": "1 Pet", "2 Peter": "2 Pet", "1 John": "1 John",
  "2 John": "2 John", "3 John": "3 John", Jude: "Jude", Revelation: "Rev",
}

export const RED_LETTER_CHAPTERS = new Set([
  "Matthew", "Mark", "Luke", "John",
])
