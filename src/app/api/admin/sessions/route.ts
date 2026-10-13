import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { z } from "zod";

const createSessionSchema = z.object({
  bookSectionId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  orderInBook: z.number().int().positive(),
});

// POST /api/admin/sessions
// إنشاء مجلس جديد مع ترتيب المجالس تلقائيًا

export async function POST(req: Request) {
  try {
    // التأكد من صلاحية المستخدم
    const user = await requireRole(["ADMIN", "TEACHER"]);

    // قراءة البيانات والتحقق منها
    const body = createSessionSchema.parse(await req.json());

    // تنفيذ جميع التعديلات داخل Transaction
    const session = await prisma.$transaction(async (tx) => {

      // 1. جلب المجالس الموجودة داخل نفس الباب
      const existingSessions = await tx.session.findMany({
        where: {
          bookSectionId: body.bookSectionId,
        },
        orderBy: [
          { orderInBook: "asc" },
          { createdAt: "asc" },
          { id: "asc" },
        ],
      });

      // 2. تحديد مكان المجلس الجديد
      const position = Math.min(
        Math.max(body.orderInBook - 1, 0),
        existingSessions.length
      );

      // 3. إنشاء المجلس الجديد
      const newSession = await tx.session.create({
        data: {
          bookSectionId:
