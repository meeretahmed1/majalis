import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import Link from "next/link";
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

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-majalis-gold/30 bg-majalis-card p-5">
        <div className="flex gap-4">
          <div className="text-5xl">{book.cover ?? "📗"}</div>
          <div>
            <h1 className="font-display text-xl">{book.title}</h1>
            <p className="text-sm text-majalis-ink/60">
              {book.author?.name} — يشرحه: {book.teacher?.name}
            </p>
            <p className="mt-1 text-sm">{book.description}</p>
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
