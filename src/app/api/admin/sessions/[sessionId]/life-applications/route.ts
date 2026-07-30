import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    const { title, description } = await req.json();
    const app = await prisma.lifeApplication.create({ data: { sessionId: params.sessionId, title, description } });
    return NextResponse.json(app, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
