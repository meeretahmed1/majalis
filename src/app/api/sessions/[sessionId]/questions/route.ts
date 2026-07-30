import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, assertOwnership, getCurrentUser } from "@/lib/rbac";

// GET -> الطالب يرى أسئلته الخاصة فقط. المعلم/الإدارة يرون كل الأسئلة المُرسلة "toTeacher" على هذا المجلس.
export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);

  if (user.role === "STUDENT") {
    const questions = await prisma.question.findMany({
      where: { sessionId: params.sessionId, userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(questions);
  }

  const questions = await prisma.question.findMany({
    where: { sessionId: params.sessionId, category: "TO_TEACHER" },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(questions);
}

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
    const { content, category } = await req.json();

    const question = await prisma.question.create({
      data: { userId: user.id, sessionId: params.sessionId, content, category: category ?? "PRIVATE" },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}

// PATCH -> يستخدمها المعلم/الإدارة للإجابة عن سؤال، أو الطالب لتعديل تصنيف سؤاله الخاص فقط
export async function PATCH(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
    const { questionId, answer, category } = await req.json();

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 });

    if (answer !== undefined) {
      // الإجابة عن الأسئلة صلاحية للمعلم/الإدارة فقط
      if (user.role === "STUDENT") {
        const err = new Error("لا تملك صلاحية الإجابة عن الأسئلة");
        (err as any).status = 403;
        throw err;
      }
      const updated = await prisma.question.update({
        where: { id: questionId },
        data: { answer, category: "ANSWERED", answeredById: user.id },
      });
      return NextResponse.json(updated);
    }

    // الطالب يعدّل تصنيف سؤاله الخاص فقط
    assertOwnership(question.userId, user.id);
    const updated = await prisma.question.update({ where: { id: questionId }, data: { category } });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
