import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// POST -> body: { linkedSessionId, linkType, label }
// linkType واحد من: PREREQUISITE, COMPLEMENTARY, SIMILAR, OPPOSING_VIEW, CROSS_BOOK
export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    const { linkedSessionId, linkType, label } = await req.json();

    const link = await prisma.sessionLink.create({
      data: { sessionId: params.sessionId, linkedSessionId, linkType, label },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
