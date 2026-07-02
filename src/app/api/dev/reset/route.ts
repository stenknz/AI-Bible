import { NextResponse } from "next/server"
import { execSync } from "child_process"

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 })
  }

  try {
    execSync("npx prisma db push --force-reset", { cwd: process.cwd(), stdio: "pipe", timeout: 60000 })
    execSync("npx tsx prisma/seed.ts", { cwd: process.cwd(), stdio: "pipe", timeout: 300000 })
    return NextResponse.json({ success: true, message: "Database reset and reseeded" })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
