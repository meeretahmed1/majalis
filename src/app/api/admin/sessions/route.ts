import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { z } from "zod";

const createSessionSchema = z.object({
  bookSectionId: z.string(),
  title: z.string().min(1),
  slug: z.string().min(1),
  orderInBook: z.number().int(),
});

// POST /api/admin/sessions -> إنشاء مجلس جديد كمسودة، مع سجلات فرعية فارغة جاهزة للتعبئة
export async function POST(req: Request) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER"]);
    const body = createSessionSchema.parse(await req.json());

    const session = await prisma.session.create({
      data: {
        ...body,
        status: "DRAFT",
        summary: { create: { keyIdeas: [], terms: [], evidences: [], benefits: [], reviewPoints: [] } },
      },
    });

    await prisma.auditLog.create({
      data: { adminId: user.id, action: "CREATE_SESSION", entityType: "Session", entityId: session.id },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
