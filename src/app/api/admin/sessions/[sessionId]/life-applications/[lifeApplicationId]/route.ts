import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function PATCH(req: Request, { params }: { params: { lifeApplicationId: string } }) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    const data = await req.json();
    const app = await prisma.lifeApplication.update({ where: { id: params.lifeApplicationId }, data });
    return NextResponse.json(app);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { lifeApplicationId: string } }) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    await prisma.lifeApplication.delete({ where: { id: params.lifeApplicationId } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
