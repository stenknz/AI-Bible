import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16

function deriveKey(): Buffer {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is required for API key encryption")
  return crypto.createHash("sha256").update(secret).digest()
}

export function encryptApiKey(plaintext: string): string {
  const key = deriveKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decryptApiKey(ciphertext: string): string {
  const key = deriveKey()
  const parts = ciphertext.split(":")
  if (parts.length !== 3) throw new Error("Invalid encrypted key format")
  const [ivHex, tagHex, encHex] = parts
  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")
  const encrypted = Buffer.from(encHex, "hex")
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final("utf8")
}
