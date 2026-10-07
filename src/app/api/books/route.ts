import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { z } from "zod";

// GET /api/books  -> قائمة الكتب المنشورة فقط (لواجهة الطالب)
export async function GET() {
  const books = await prisma.book.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true, author: true, teacher: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(books);
}

const createBookSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().min(1),
  goals: z.array(z.string()).default([]),
  level: z.string().default("مبتدئ"),
  estimatedDuration: z.string().default(""),
  categoryId: z.string().optional(),
  authorId: z.string().optional(),
  teacherId: z.string().optional(),
  cover: z.string().optional(),
});

// POST /api/books -> إنشاء كتاب جديد (Admin فقط)، يُحفظ كمسودة (DRAFT) افتراضياً
export async function POST(req: Request) {
  try {
    const user = await requireRole(["ADMIN"]);
   const body = createBookSchema.parse(await req.json());

// Always generate the technical URL slug on the server.
// This avoids Arabic URL-encoding problems and duplicate slugs.
const safeSlug = `book-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

const book = await prisma.book.create({
      data: { ...body, slug: safeSlug, status: "DRAFT", sections: { create: { title: "الباب الأول", order: 1 } } },
      include: { sections: true },
    });

    await prisma.auditLog.create({
      data: { adminId: user.id, action: "CREATE_BOOK", entityType: "Book", entityId: book.id },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
