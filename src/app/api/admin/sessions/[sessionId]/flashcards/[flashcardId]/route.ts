import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function PATCH(req: Request, { params }: { params: { flashcardId: string } }) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    const data = await req.json();
    const card = await prisma.flashcard.update({ where: { id: params.flashcardId }, data });
    return NextResponse.json(card);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { flashcardId: string } }) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    await prisma.flashcard.delete({ where: { id: params.flashcardId } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
