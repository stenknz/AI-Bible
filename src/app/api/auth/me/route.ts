import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { getUserById } from "@/modules/auth/services/auth-service"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }
  const user = await getUserById(session.userId)
  if (!user) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })
}
