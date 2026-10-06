import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OLD_SLUG =
  "كتاب-فتح-القريب-المجيب-في-شرح-ألفاظ-التقريب";

const NEW_SLUG = "fath-al-qareeb";

export async function POST(request: Request) {
  // Temporary protection: only allow requests carrying the deployment secret.
  const secret = request.headers.get("x-fix-secret");

  if (!process.env.NEXTAUTH_SECRET || secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existingNew = await prisma.book.findUnique({
      where: { slug: NEW_SLUG },
    });

    if (existingNew) {
      return NextResponse.json({
        success: true,
        message: "Book already uses the new slug.",
        slug: NEW_SLUG,
      });
    }

    const oldBook = await prisma.book.findUnique({
      where: { slug: OLD_SLUG },
    });

    if (!oldBook) {
      return NextResponse.json(
        {
          success: false,
          error: "Book was not found using either slug.",
        },
        { status: 404 }
      );
    }

    await prisma.book.update({
      where: { id: oldBook.id },
      data: { slug: NEW_SLUG },
    });

    return NextResponse.json({
      success: true,
      message: "Slug updated successfully.",
      slug: NEW_SLUG,
    });
  } catch (error) {
    console.error("Temporary slug fix failed:", error);

    return NextResponse.json(
      { success: false, error: "Database update failed." },
      { status: 500 }
    );
  }
}