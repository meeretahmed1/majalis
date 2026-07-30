import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// GET /api/sessions/:sessionId -> كل محتوى المجلس اللازم لصفحة المجلس
export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      summary: true,
      mindMap: true,
      flashcards: true,
      quizQuestions: true,
      lifeApplications: true,
      linksFrom: { include: { linkedSession: { select: { id: true, title: true, slug: true } } } },
      bookSection: { include: { book: { select: { id: true, title: true, slug: true } } } },
    },
  });

  if (!session) return NextResponse.json({ error: "المجلس غير موجود" }, { status: 404 });
  return NextResponse.json(session);
}

// PATCH /api/sessions/:sessionId -> تعديل الحقول الأساسية للمجلس (Admin/Teacher)
export async function PATCH(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER"]);
    const data = await req.json();

    const session = await prisma.session.update({ where: { id: params.sessionId }, data });

    await prisma.auditLog.create({
      data: { adminId: user.id, action: "UPDATE_SESSION", entityType: "Session", entityId: session.id },
    });

    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
