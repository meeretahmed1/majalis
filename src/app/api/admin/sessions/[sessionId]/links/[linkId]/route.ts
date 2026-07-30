import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function DELETE(_req: Request, { params }: { params: { linkId: string } }) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    await prisma.sessionLink.delete({ where: { id: params.linkId } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
