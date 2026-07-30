import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// PATCH -> body قد يحوي: الحقول الأساسية (title, date, duration, videoUrl, audioUrl, textContent, status, publishAt)
//          وحقول summary.* وmindMap.nodesJson (اختيارية) لتحديث المرتبطات مباشرة
export async function PATCH(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER"]);
    const body = await req.json();
    const { summary, mindMap, ...sessionFields } = body;

    const session = await prisma.session.update({
      where: { id: params.sessionId },
      data: {
        ...sessionFields,
        ...(summary
          ? { summary: { upsert: { create: summary, update: summary } } }
          : {}),
        ...(mindMap
          ? { mindMap: { upsert: { create: { nodesJson: mindMap }, update: { nodesJson: mindMap } } } }
          : {}),
      },
      include: { summary: true, mindMap: true },
    });

    await prisma.auditLog.create({
      data: { adminId: user.id, action: "UPDATE_SESSION_CONTENT", entityType: "Session", entityId: session.id },
    });

    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}

// DELETE -> حذف المجلس نهائياً (Admin فقط)
export async function DELETE(_req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const user = await requireRole(["ADMIN"]);
    await prisma.session.delete({ where: { id: params.sessionId } });

    await prisma.auditLog.create({
      data: { adminId: user.id, action: "DELETE_SESSION", entityType: "Session", entityId: params.sessionId },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
