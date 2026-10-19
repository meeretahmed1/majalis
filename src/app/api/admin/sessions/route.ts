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
// Create a new session with automatic ordering

export async function POST(req: Request) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER"]);

    const body = createSessionSchema.parse(await req.json());

    const session = await prisma.$transaction(async (tx) => {

      // 1. Get existing sessions in the same book section
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

      // 2. Calculate the insertion position
      const position = Math.min(
        Math.max(body.orderInBook - 1, 0),
        existingSessions.length
      );

      // 3. Create the new session
      const newSession = await tx.session.create({
        data: {
          bookSectionId: body.bookSectionId,
          title: body.title,
          slug: body.slug,
          orderInBook: existingSessions.length + 1,
          status: "DRAFT",
          summary: {
            create: {
              keyIdeas: [],
              terms: [],
              evidences: [],
              benefits: [],
              reviewPoints: [],
            },
          },
        },
      });

      // 4. Insert new session into the correct position
      const orderedIds = existingSessions.map((s) => s.id);

      orderedIds.splice(position, 0, newSession.id);

      // 5. Update the order of all sessions
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.session.update({
          where: {
            id: orderedIds[i],
          },
          data: {
            orderInBook: i + 1,
          },
        });
      }

      // 6. Record the operation in AuditLog
      await tx.auditLog.create({
        data: {
          adminId: user.id,
          action: "CREATE_SESSION",
          entityType: "Session",
          entityId: newSession.id,
        },
      });

      return newSession;
    });

    return NextResponse.json(session, { status: 201 });

  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || "تعذر إنشاء المجلس",
      },
      {
        status: err?.status ?? 400,
      }
    );
  }
}
