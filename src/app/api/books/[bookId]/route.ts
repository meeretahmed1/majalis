import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// GET /api/books/:bookId -> تفاصيل الكتاب مع الأبواب والمجالس المنشورة فقط
export async function GET(_req: Request, { params }: { params: { bookId: string } }) {
  const book = await prisma.book.findUnique({
    where: { id: params.bookId },
    include: {
      category: true,
      author: true,
      teacher: true,
      sections: {
        orderBy: { order: "asc" },
        include: {
          sessions: {
            where: { status: "PUBLISHED" },
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
export async function PATCH(req: Request, { params }: { params: { bookId: string } }) {
  try {
    const user = await requireRole(["ADMIN"]);
    const data = await req.json();

    const book = await prisma.book.update({ where: { id: params.bookId }, data });

    await prisma.auditLog.create({
      data: { adminId: user.id, action: "UPDATE_BOOK", entityType: "Book", entityId: book.id },
    });

    return NextResponse.json(book);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}

// DELETE /api/books/:bookId -> حذف الكتاب (Admin فقط)
export async function DELETE(_req: Request, { params }: { params: { bookId: string } }) {
  try {
    const user = await requireRole(["ADMIN"]);
    await prisma.book.delete({ where: { id: params.bookId } });

    await prisma.auditLog.create({
      data: { adminId: user.id, action: "DELETE_BOOK", entityType: "Book", entityId: params.bookId },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
