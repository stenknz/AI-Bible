import { NextResponse } from "next/server"
import { getUserByEmail, verifyPassword } from "@/modules/auth/services/auth-service"
import { createSession } from "@/modules/auth/services/session"

export async function POST(request: Request) {
  const { email, password } = await request.json()
  const user = await getUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }
  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }
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
