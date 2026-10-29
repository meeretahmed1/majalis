import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

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
        {books.map((book) => {
          const isImageCover = Boolean(book.cover && (book.cover.startsWith("/") || book.cover.startsWith("http")));

          return (
            <Link
              key={book.id}
              href={`/books/${book.slug}`}
              className="group flex gap-4 rounded-xl border border-majalis-gold/30 bg-majalis-card p-4 hover:border-majalis-gold hover:shadow-md transition-all duration-200"
            >
              <div className="relative shrink-0 w-16 h-24 sm:w-20 sm:h-28 rounded-lg overflow-hidden border border-majalis-gold/40 shadow-sm bg-majalis-beige/50 flex items-center justify-center">
                {isImageCover ? (
                  <Image
                    src={book.cover!}
                    alt={book.title}
                    fill
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 80px, 96px"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-3xl">{book.cover ?? "📗"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg group-hover:text-majalis-green transition-colors">{book.title}</div>
                <div className="text-xs text-majalis-ink/60">
                  {book.category?.name} · {book.author?.name}
                </div>
                <p className="mt-1 text-sm text-majalis-ink/80 line-clamp-2">{book.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
