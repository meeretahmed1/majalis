import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// GET -> ملاحظات المستخدم الحالي فقط على هذا المجلس (لا يرى أحد ملاحظات غيره)
export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
  const notes = await prisma.note.findMany({
    where: { sessionId: params.sessionId, userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notes);
}

// POST -> إضافة ملاحظة جديدة (تُحفظ تلقائياً من الواجهة عند كل تعديل)
export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
    const { contentRichText, timestampInMedia } = await req.json();

    const note = await prisma.note.create({
      data: {
        userId: user.id,
        sessionId: params.sessionId,
        contentRichText,
        timestampInMedia: timestampInMedia ?? null,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
