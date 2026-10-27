import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({
        notes: [],
        reflections: [],
        commitments: [],
        authenticated: false,
      });
    }

    const [notes, reflections, commitments] = await Promise.all([
      prisma.note.findMany({
        where: { userId },
        include: {
          session: {
            include: {
              bookSection: {
                include: { book: true },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.reflection.findMany({
        where: { userId },
        include: {
          session: {
            include: {
              bookSection: {
                include: { book: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.userApplicationCommitment.findMany({
        where: { userId },
        include: {
          lifeApplication: {
            include: {
              session: {
                include: {
                  bookSection: {
                    include: { book: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { committedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      notes,
      reflections,
      commitments,
      authenticated: true,
    });
  } catch (error: any) {
    console.error("Notebook API error:", error);
    return NextResponse.json({ notes: [], reflections: [], commitments: [], authenticated: false });
  }
}
