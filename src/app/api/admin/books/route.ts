import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { FATH_AL_QAREEB_LEGACY_SLUG, FATH_AL_QAREEB_SLUG } from "@/lib/book-slugs";

// GET /api/admin/books
export async function GET() {
  try {
    await requireRole(["ADMIN", "TEACHER"]);

    const books = await prisma.book.findMany({
      include: {
        sections: {
          include: {
            sessions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(books);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 400 }
    );
  }
}

// POST /api/admin/books
// Temporary route to add فتح القريب safely to the production database
export async function POST() {
  try {
    await requireRole(["ADMIN"]);

    const slug = FATH_AL_QAREEB_SLUG;

    // If the old Arabic-slug record exists, migrate it in place so all relations are preserved.
    const canonicalBook = await prisma.book.findUnique({ where: { slug } });
    const legacyBook = await prisma.book.findUnique({
      where: { slug: FATH_AL_QAREEB_LEGACY_SLUG },
    });

    if (!canonicalBook && legacyBook) {
      const migratedBook = await prisma.book.update({
        where: { id: legacyBook.id },
        data: { slug },
      });
      return NextResponse.json({
        success: true,
        migrated: true,
        book: migratedBook,
      });
    }

    // If the canonical book already exists, return it instead of creating a duplicate.
    const existingBook = canonicalBook;

    if (existingBook) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        book: existingBook,
      });
    }

    // Category
    const category = await prisma.category.upsert({
      where: {
        slug: "fiqh-shafii",
      },
      update: {},
      create: {
        name: "الفقه الشافعي",
        slug: "fiqh-shafii",
        order: 2,
      },
    });

    // Author
    let author = await prisma.author.findFirst({
      where: {
        name: "ابن قاسم الغزي",
      },
    });

    if (!author) {
      author = await prisma.author.create({
        data: {
          name: "ابن قاسم الغزي",
          bio: "صاحب شرح فتح القريب المجيب على متن أبي شجاع.",
        },
      });
    }

    // Book
    const book = await prisma.book.create({
      data: {
        title: "فتح القريب المجيب في شرح ألفاظ التقريب",

        slug,

        cover: "📖",

        description:
          "شرح فقهي على متن أبي شجاع في الفقه الشافعي، مرتب وفق أبواب الفقه.",

        goals: [
          "فهم المسائل الأساسية في الفقه الشافعي",
          "دراسة متن أبي شجاع بصورة منظمة",
          "ربط المتن بشرحه وتوضيح ألفاظه",
        ],

        level: "مبتدئ",

        estimatedDuration: "16 أسبوع",

        status: "PUBLISHED",

        publishedAt: new Date(),

        categoryId: category.id,

        authorId: author.id,

        teacherId: author.id,

        sections: {
          create: [
            {
              title: "مقدمة الكتاب",
              order: 1,
            },
            {
              title: "كتاب الطهارة",
              order: 2,
            },
            {
              title: "كتاب الصلاة",
              order: 3,
            },
          ],
        },
      },

      include: {
        sections: true,
        author: true,
      },
    });

    return NextResponse.json({
      success: true,
      alreadyExists: false,
      book,
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      {
        status: err.status ?? 500,
      }
    );
  }
}
