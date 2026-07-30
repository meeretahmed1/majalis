import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// GET -> التزامات المستخدم المرتبطة بتطبيقات هذا المجلس ("رحلتي من العلم إلى العمل")
export async function GET(_req: Request, { params }: { params: { sessionId: string } }) {
  const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
  const commitments = await prisma.userApplicationCommitment.findMany({
    where: { userId: user.id, lifeApplication: { sessionId: params.sessionId } },
    include: { lifeApplication: true },
  });
  return NextResponse.json(commitments);
}

// POST -> body: { lifeApplicationId }  زر "سأطبق هذا"
export async function POST(req: Request, { params: _params }: { params: { sessionId: string } }) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
    const { lifeApplicationId } = await req.json();

    const commitment = await prisma.userApplicationCommitment.upsert({
      where: { userId_lifeApplicationId: { userId: user.id, lifeApplicationId } },
      create: { userId: user.id, lifeApplicationId },
      update: { status: "active" },
    });

    return NextResponse.json(commitment, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}

// PATCH -> body: { commitmentId, followUp1Day?|followUp1Week?|followUp1Month?, status? } لتحديث متابعة الالتزام
export async function PATCH(req: Request) {
  try {
    const user = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
    const { commitmentId, ...patch } = await req.json();

    const existing = await prisma.userApplicationCommitment.findUnique({ where: { id: commitmentId } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "لا يمكنك تعديل التزام مستخدم آخر" }, { status: 403 });
    }

    const updated = await prisma.userApplicationCommitment.update({ where: { id: commitmentId }, data: patch });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
