import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params

  const relations = await prisma.entityRelation.findMany({
    where: {
      OR: [
        { subjectId: id, subjectType: type },
        { objectId: id, objectType: type },
      ],
    },
    take: 50,
  })

  return NextResponse.json({ relations })
}
