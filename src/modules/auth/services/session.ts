import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { JWT_SECRET } from "@/lib/constants"

const secret = new TextEncoder().encode(JWT_SECRET)

type SessionPayload = {
  userId: string
  email: string
  role: string
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  return verifySession()
}
