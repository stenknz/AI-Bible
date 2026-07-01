import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/services/session"
import { importBibleTSV } from "@/modules/bible/services/import-service"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File
  const code = formData.get("code") as string
  const name = formData.get("name") as string

  if (!file || !code || !name) {
    return NextResponse.json({ error: "Missing file, code, or name" }, { status: 400 })
  }

  const content = await file.text()
  const result = await importBibleTSV(content, code.toUpperCase(), name)

  return NextResponse.json(result)
}
