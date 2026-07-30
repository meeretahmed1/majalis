import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function PATCH(req: Request, { params }: { params: { quizQuestionId: string } }) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    const data = await req.json();
    const q = await prisma.quizQuestion.update({ where: { id: params.quizQuestionId }, data });
    return NextResponse.json(q);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { quizQuestionId: string } }) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    await prisma.quizQuestion.delete({ where: { id: params.quizQuestionId } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
