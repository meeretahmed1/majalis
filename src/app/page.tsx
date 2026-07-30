import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const books = await prisma.book.findMany({
    where: { status: "PUBLISHED" },
    include: { author: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return (
    <div>
      <section className="mb-8 rounded-2xl border border-majalis-gold/30 bg-majalis-card p-6">
        <h1 className="font-display text-2xl">من المجلس إلى الحياة</h1>
        <p className="mt-2 text-sm text-majalis-ink/70">
          ادرس الكتب التراثية والإسلامية مجلساً مجلساً: استمع، لخّص، راجع بالبطاقات، اختبر فهمك، ثم طبّق ما تعلمته في حياتك.
        </p>
        <Link
          href="/library"
          className="mt-4 inline-block rounded-lg bg-majalis-green px-4 py-2 text-sm text-majalis-goldSoft"
        >
          ابدأ رحلة التعلم
        </Link>
      </section>

      <h2 className="mb-3 text-sm text-majalis-ink/60">الكتب المميزة</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {books.length === 0 && (
          <p className="text-sm text-majalis-ink/60">
            لا توجد كتب منشورة بعد. سجّل الدخول كمدير وأضف أول كتاب من لوحة التحكم.
          </p>
        )}
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.slug}`}
            className="flex gap-3 rounded-xl border border-majalis-gold/30 bg-majalis-card p-4 hover:border-majalis-gold"
          >
            <div className="text-4xl">{book.cover ?? "📗"}</div>
            <div>
              <div className="font-display text-lg">{book.title}</div>
              <div className="text-xs text-majalis-ink/60">{book.author?.name} · {book.level}</div>
              <p className="mt-1 text-sm text-majalis-ink/80 line-clamp-2">{book.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
