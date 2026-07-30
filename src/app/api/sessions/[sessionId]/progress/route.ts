import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// POST -> body: { status: "IN_PROGRESS" | "COMPLETED", lastPosition? }
export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
    const { status, lastPosition } = await req.json();

    const sessionProgress = await prisma.userSessionProgress.upsert({
      where: { userId_sessionId: { userId: user.id, sessionId: params.sessionId } },
      create: { userId: user.id, sessionId: params.sessionId, status, lastPosition: lastPosition ?? 0 },
      update: { status, lastPosition: lastPosition ?? undefined },
    });

    // نُحدّث أيضاً نسبة تقدم الكتاب ككل
    const session = await prisma.session.findUnique({
      where: { id: params.sessionId },
      include: { bookSection: true },
    });
    if (session) {
      const bookId = session.bookSection.bookId;
      const allSessions = await prisma.session.count({
        where: { bookSection: { bookId }, status: "PUBLISHED" },
      });
      const completedSessions = await prisma.userSessionProgress.count({
        where: { userId: user.id, status: "COMPLETED", session: { bookSection: { bookId } } },
      });
      const percentComplete = allSessions ? Math.round((completedSessions / allSessions) * 100) : 0;

      await prisma.userBookProgress.upsert({
        where: { userId_bookId: { userId: user.id, bookId } },
        create: { userId: user.id, bookId, percentComplete, lastSessionId: params.sessionId },
        update: { percentComplete, lastSessionId: params.sessionId },
      });
    }

    return NextResponse.json(sessionProgress);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
