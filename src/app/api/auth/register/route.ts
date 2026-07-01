import { NextResponse } from "next/server"
import { createUser, getUserByEmail } from "@/modules/auth/services/auth-service"
import { createSession } from "@/modules/auth/services/session"

export async function POST(request: Request) {
  const { email, password, name } = await request.json()
  const existing = await getUserByEmail(email)
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }
  const user = await createUser(email, password, name)
  const token = await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
  const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  return response
}
