import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// GET -> محاولات المستخدم الحالي على أسئلة هذا المجلس (لعرض آخر نتيجة)
export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: user.id, quizQuestion: { sessionId: params.sessionId } },
    orderBy: { attemptedAt: "desc" },
  });
  return NextResponse.json(attempts);
}

// POST -> body: { answers: [{ quizQuestionId, userAnswer }] } تُقيَّم على السيرفر (لا تصل الإجابة الصحيحة للعميل مسبقاً)
export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
    const { answers } = await req.json() as { answers: Array<{ quizQuestionId: string; userAnswer: number }> };

    const questions = await prisma.quizQuestion.findMany({
      where: { sessionId: params.sessionId, id: { in: answers.map((a) => a.quizQuestionId) } },
    });

    const results = await Promise.all(
      answers.map(async (a) => {
        const q = questions.find((qq) => qq.id === a.quizQuestionId);
        const isCorrect = q ? q.correctAnswer === a.userAnswer : false;

        await prisma.quizAttempt.create({
          data: { userId: user.id, quizQuestionId: a.quizQuestionId, userAnswer: a.userAnswer, isCorrect },
        });

        return { quizQuestionId: a.quizQuestionId, isCorrect, explanation: q?.explanation ?? null, correctAnswer: q?.correctAnswer };
      })
    );

    const score = results.filter((r) => r.isCorrect).length;
    return NextResponse.json({ score, total: results.length, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
