import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const [notesCount, reflectionsCount, questionsCount, completedCount, dueFlashcards, commitments] = await Promise.all([
    prisma.note.count({ where: { userId } }),
    prisma.reflection.count({ where: { userId } }),
    prisma.question.count({ where: { userId } }),
    prisma.userSessionProgress.count({ where: { userId, status: "COMPLETED" } }),
    prisma.flashcardReview.count({ where: { userId, nextReviewAt: { lte: new Date() } } }),
    prisma.userApplicationCommitment.findMany({
      where: { userId, status: "active" },
      include: { lifeApplication: { include: { session: { include: { bookSection: { include: { book: true } } } } } } },
      orderBy: { committedAt: "desc" },
    }),
  ]);

  const Stat = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-xl border border-majalis-gold/30 bg-majalis-card p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-majalis-ink/60">{label}</div>
    </div>
  );

  return (
    <div>
      <h1 className="font-display mb-4 text-xl">لوحتي الشخصية — {session.user.name}</h1>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="ملاحظات" value={notesCount} />
        <Stat label="خواطر" value={reflectionsCount} />
        <Stat label="أسئلة" value={questionsCount} />
        <Stat label="مجالس مكتملة" value={completedCount} />
        <Stat label="بطاقات مستحقة" value={dueFlashcards} />
        <Stat label="التزامات نشطة" value={commitments.length} />
      </div>

      <h2 className="mb-2 text-sm text-majalis-ink/60">رحلتي من العلم إلى العمل</h2>
      {commitments.length === 0 && <p className="text-sm text-majalis-ink/60">لم تلتزم بأي تطبيق حياتي بعد.</p>}
      <div className="flex flex-col gap-2">
        {commitments.map((c) => {
          const book = c.lifeApplication.session.bookSection.book;
          return (
            <Link
              key={c.id}
              href={`/books/${book.slug}/sessions/${c.lifeApplication.session.slug}`}
              className="rounded-lg border border-majalis-gold/30 bg-majalis-card p-3"
            >
              <p className="text-sm font-medium">{c.lifeApplication.title}</p>
              <p className="text-xs text-majalis-ink/60">
                من مجلس: {c.lifeApplication.session.title} — التزمت في {c.committedAt.toLocaleDateString("ar-EG")}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
