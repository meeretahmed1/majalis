import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { nextReview, type Difficulty } from "@/lib/srs";

// GET -> البطاقات المستحقة للمراجعة اليوم لهذا المستخدم عبر كل المجالس (يتجاهل sessionId إن كانت القيمة "all")
export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);

  const where =
    params.sessionId === "all"
      ? { userId: user.id, nextReviewAt: { lte: new Date() } }
      : { userId: user.id, flashcard: { sessionId: params.sessionId } };

  const due = await prisma.flashcardReview.findMany({ where, include: { flashcard: true } });
  return NextResponse.json(due);
}

// POST -> body: { flashcardId, difficulty: "EASY"|"MEDIUM"|"HARD" }
export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
    const { flashcardId, difficulty } = await req.json() as { flashcardId: string; difficulty: Difficulty };

    const previous = await prisma.flashcardReview.findUnique({
      where: { userId_flashcardId: { userId: user.id, flashcardId } },
    });

    const { nextReviewAt } = nextReview(
      previous ? { intervalDays: 1, easeFactor: 2.3 } : null,
      difficulty
    );

    const review = await prisma.flashcardReview.upsert({
      where: { userId_flashcardId: { userId: user.id, flashcardId } },
      create: { userId: user.id, flashcardId, difficulty, nextReviewAt },
      update: { difficulty, nextReviewAt, reviewedAt: new Date() },
    });

    return NextResponse.json(review);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
