import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// GET /api/admin/books -> كل الكتب بكل حالاتها (مسودة/منشور) لعرضها في لوحة التحكم
export async function GET() {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    const books = await prisma.book.findMany({
      include: { sections: { include: { sessions: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(books);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
