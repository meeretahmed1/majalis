import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const books = await prisma.book.findMany({
    where: { status: "PUBLISHED" },
    include: { author: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display mb-4 text-xl">المكتبة</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.slug}`}
            className="flex gap-3 rounded-xl border border-majalis-gold/30 bg-majalis-card p-4 hover:border-majalis-gold"
          >
            <div className="text-4xl">{book.cover ?? "📗"}</div>
            <div>
              <div className="font-display text-lg">{book.title}</div>
              <div className="text-xs text-majalis-ink/60">
                {book.category?.name} · {book.author?.name}
              </div>
              <p className="mt-1 text-sm text-majalis-ink/80 line-clamp-2">{book.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
