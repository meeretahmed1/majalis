import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { normalizeBookSlug } from "@/lib/book-slugs";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const normalizedSlug = normalizeBookSlug(slug);

  // Keep old Arabic links working, but use a stable ASCII slug as the canonical URL.
  if (normalizedSlug !== slug) {
    redirect(`/books/${normalizedSlug}`);
  }

  const book = await prisma.book.findUnique({
    where: { slug: normalizedSlug },
    include: {
      author: true,
      teacher: true,
      sections: {
        orderBy: { order: "asc" },
        include: { sessions: { where: { status: "PUBLISHED" }, orderBy: { orderInBook: "asc" } } },
      },
    },
  });

  if (!book) notFound();

  const user = await getCurrentUser();
  let progressBySession: Record<string, string> = {};
  if (user) {
    const rows = await prisma.userSessionProgress.findMany({
      where: { userId: user.id, session: { bookSection: { bookId: book.id } } },
    });
    progressBySession = Object.fromEntries(rows.map((r) => [r.sessionId, r.status]));
  }

  const allSessions = book.sections.flatMap((s) => s.sessions);
  const completed = allSessions.filter((s) => progressBySession[s.id] === "COMPLETED").length;
  const percent = allSessions.length ? Math.round((completed / allSessions.length) * 100) : 0;

  const isImageCover = Boolean(book.cover && (book.cover.startsWith("/") || book.cover.startsWith("http")));

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-majalis-gold/30 bg-majalis-card p-5">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="relative shrink-0 w-24 h-36 sm:w-28 sm:h-40 rounded-xl overflow-hidden border border-majalis-gold/40 shadow-md bg-majalis-beige/50 flex items-center justify-center">
            {isImageCover ? (
              <Image
                src={book.cover!}
                alt={book.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 640px) 96px, 112px"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-5xl">{book.cover ?? "📗"}</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl">{book.title}</h1>
            <p className="mt-1 text-sm text-majalis-ink/60">
              {book.author?.name} — يشرحه: {book.teacher?.name}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-majalis-ink/80">{book.description}</p>
          </div>
        </div>
        {user && (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-majalis-beige">
              <div className="h-full bg-majalis-gold" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 text-xs text-majalis-ink/60">{percent}% مكتمل — {completed} من {allSessions.length}</p>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {book.goals.map((g, i) => (
            <span key={i} className="rounded-full border border-majalis-gold/30 bg-majalis-beige px-3 py-1 text-xs">
              {g}
            </span>
          ))}
        </div>
      </div>

      {book.sections.map((section) => (
        <div key={section.id} className="mb-6">
          <h2 className="mb-2 text-sm text-majalis-ink/60">{section.title}</h2>
          <div className="flex flex-col gap-2">
            {section.sessions.map((s, i) => {
              const status = progressBySession[s.id];
              return (
                <Link
                  key={s.id}
                  href={`/books/${book.slug}/sessions/${s.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-majalis-gold/30 bg-majalis-card p-3 hover:border-majalis-gold"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs ${
                      status === "COMPLETED" ? "bg-majalis-gold" : "bg-majalis-beige"
                    }`}
                  >
                    {status === "COMPLETED" ? "✓" : i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-xs text-majalis-ink/60">{s.date} · {s.duration}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
