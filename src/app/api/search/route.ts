import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    const [books, sessions] = await Promise.all([
      prisma.book.findMany({
        where: { status: "PUBLISHED" },
        include: { author: true },
      }),
      prisma.session.findMany({
        where: { status: "PUBLISHED" },
        include: {
          bookSection: {
            include: {
              book: true,
            },
          },
          summary: true,
        },
      }),
    ]);

    // Format all items for search indexing
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: "book" | "session" | "term" | "navigation";
      href: string;
      keywords: string[];
    }> = [];

    // Quick navigation entries
    items.push(
      {
        id: "nav-library",
        title: "المكتبة التراثية",
        subtitle: "تصفح جميع الكتب والمصنفات المنشورة",
        category: "navigation",
        href: "/library",
        keywords: ["كتب", "مكتبة", "فهرس", "library", "books"],
      },
      {
        id: "nav-notebook",
        title: "دفتر الفوائد والتطبيقات",
        subtitle: "ملاحظاتك، خواطرك، والتزاماتك في الحياة",
        category: "navigation",
        href: "/notebook",
        keywords: ["دفتر", "ملاحظات", "خواطر", "تطبيقات", "فوائد", "notebook", "notes"],
      }
    );

    // Books
    for (const b of books) {
      items.push({
        id: `book-${b.id}`,
        title: b.title,
        subtitle: `كتاب بقلم ${b.author?.name || "المؤلف"} · ${b.level}`,
        category: "book",
        href: `/books/${b.slug}`,
        keywords: [b.title, b.description || "", b.author?.name || "", b.level],
      });
    }

    // Sessions and terms
    for (const s of sessions) {
      const bookSlug = s.bookSection?.book?.slug;
      const bookTitle = s.bookSection?.book?.title || "";
      if (bookSlug) {
        items.push({
          id: `session-${s.id}`,
          title: s.title,
          subtitle: `${bookTitle} · ${s.duration || "مجلس علمي"}`,
          category: "session",
          href: `/books/${bookSlug}/sessions/${s.slug}`,
          keywords: [s.title, s.textContent || "", bookTitle, ...(s.summary?.keyIdeas || [])],
        });

        // Add terms extracted from session summary
        if (s.summary?.terms && Array.isArray(s.summary.terms)) {
          for (const term of s.summary.terms) {
            items.push({
              id: `term-${s.id}-${encodeURIComponent(term)}`,
              title: term,
              subtitle: `مصطلح علمي من ${s.title}`,
              category: "term",
              href: `/books/${bookSlug}/sessions/${s.slug}?tab=summary`,
              keywords: [term, s.title, bookTitle],
            });
          }
        }
      }
    }

    // Filter if query is provided
    let results = items;
    if (query) {
      const cleanQ = query.replace(/[ًٌٍَُِّْـ]/g, ""); // remove diacritics
      results = items.filter((item) => {
        const textToSearch = [
          item.title,
          item.subtitle,
          ...item.keywords,
        ].join(" ").toLowerCase().replace(/[ًٌٍَُِّْـ]/g, "");
        return textToSearch.includes(cleanQ);
      });
    }

    return NextResponse.json({ results: results.slice(0, 20) });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
