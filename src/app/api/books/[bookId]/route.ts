import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// GET /api/books/:bookId -> تفاصيل الكتاب مع الأبواب والمجالس
export async function GET(req: Request, { params }: { params: Promise<{ bookId: string }> | { bookId: string } }) {
  const { bookId } = await params;
  const url = new URL(req.url);
  const includeAll = url.searchParams.get("all") === "true";

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      category: true,
      author: true,
      teacher: true,
      sections: {
        orderBy: { order: "asc" },
        include: {
          sessions: {
            where: includeAll ? undefined : { status: "PUBLISHED" },
            orderBy: { orderInBook: "asc" },
          },
        },
      },
    },
  });

  if (!book) return NextResponse.json({ error: "الكتاب غير موجود" }, { status: 404 });
  return NextResponse.json(book);
}

// PATCH /api/books/:bookId -> تعديل بيانات الكتاب (Admin فقط)
export async function PATCH(req: Request, { params }: { params: Promise<{ bookId: string }> | { bookId: string } }) {
  try {
    const user = await requireRole(["ADMIN"]);
    const { bookId } = await params;
    const data = await req.json();

    const book = await prisma.book.update({ where: { id: bookId }, data });

    await prisma.auditLog.create({
      data: { adminId: user.id, action: "UPDATE_BOOK", entityType: "Book", entityId: book.id },
    });

    return NextResponse.json(book);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}

// DELETE /api/books/:bookId -> حذف الكتاب (Admin فقط)
export async function DELETE(_req: Request, { params }: { params: Promise<{ bookId: string }> | { bookId: string } }) {
  try {
    const user = await requireRole(["ADMIN"]);
    const { bookId } = await params;
    await prisma.book.delete({ where: { id: bookId } });

    await prisma.auditLog.create({
      data: { adminId: user.id, action: "DELETE_BOOK", entityType: "Book", entityId: bookId },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
