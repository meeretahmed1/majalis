import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
  const reflections = await prisma.reflection.findMany({
    where: { sessionId: params.sessionId, userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(reflections);
}

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
    const { content, isShared } = await req.json();

    const reflection = await prisma.reflection.create({
      data: { userId: user.id, sessionId: params.sessionId, content, isShared: Boolean(isShared) },
    });

    return NextResponse.json(reflection, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
