import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    const { front, back } = await req.json();
    const card = await prisma.flashcard.create({ data: { sessionId: params.sessionId, front, back } });
    return NextResponse.json(card, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
