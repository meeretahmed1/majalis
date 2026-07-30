import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    const { type, question, options, correctAnswer, explanation } = await req.json();
    const quizQuestion = await prisma.quizQuestion.create({
      data: { sessionId: params.sessionId, type: type ?? "MCQ", question, options, correctAnswer, explanation },
    });
    return NextResponse.json(quizQuestion, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
