import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { z } from "zod";

const reorderSchema = z.object({
  sectionId: z.string().optional(),
  orderedIds: z.array(z.string().min(1)).min(1).optional(),
  updates: z.array(z.object({
    id: z.string().min(1),
    orderInBook: z.number().int().positive(),
  })).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER"]);
    const raw = await req.json();
    const data = reorderSchema.parse(raw);

    const updatesToApply: { id: string; orderInBook: number }[] = [];

    if (data.orderedIds && data.orderedIds.length > 0) {
      data.orderedIds.forEach((id, index) => {
        updatesToApply.push({ id, orderInBook: index + 1 });
      });
    } else if (data.updates && data.updates.length > 0) {
      updatesToApply.push(...data.updates);
    } else {
      return NextResponse.json({ error: "البيانات المطلوبة لإعادة الترتيب غير متوفرة" }, { status: 400 });
    }

    // Apply updates
    for (const update of updatesToApply) {
      await prisma.session.update({
        where: { id: update.id },
        data: { orderInBook: update.orderInBook },
      });
    }

    // Log the reorder action
    try {
      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          action: "REORDER_SESSIONS",
          entityType: "Session",
          entityId: data.sectionId || updatesToApply[0].id,
        },
      });
    } catch {
      // Audit log error shouldn't fail reorder
    }

    return NextResponse.json({
      ok: true,
      count: updatesToApply.length,
      message: "تم حفظ الترتيب الجديد بنجاح",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "تعذر إعادة ترتيب المجالس" },
      { status: err?.status ?? 400 }
    );
  }
}
