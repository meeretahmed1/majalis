import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SessionTabs from "@/components/SessionTabs";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: { slug: string; sessionSlug: string };
}) {
  const book = await prisma.book.findUnique({ where: { slug: params.slug } });
  if (!book) notFound();

  const session = await prisma.session.findFirst({
    where: { slug: params.sessionSlug, bookSection: { bookId: book.id } },
    include: {
      summary: true,
      mindMap: true,
      flashcards: true,
      quizQuestions: { select: { id: true, type: true, question: true, options: true } }, // لا تُرسل الإجابة الصحيحة للعميل
      lifeApplications: true,
      linksFrom: { include: { linkedSession: { select: { id: true, title: true, slug: true } } } },
      bookSection: { include: { book: true, sessions: { where: { status: "PUBLISHED" }, orderBy: { orderInBook: "asc" } } } },
    },
  });

  if (!session) notFound();

  const siblingSessions = session.bookSection.sessions;
  const idx = siblingSessions.findIndex((s) => s.id === session.id);
  const prevSession = idx > 0 ? siblingSessions[idx - 1] : null;
  const nextSession = idx < siblingSessions.length - 1 ? siblingSessions[idx + 1] : null;

  return (
    <SessionTabs
      bookSlug={book.slug}
      session={session}
      prevSession={prevSession}
      nextSession={nextSession}
    />
  );
}
