import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminAddBookForm from "@/components/AdminAddBookForm";
import AdminAddSessionButton from "@/components/AdminAddSessionButton";
import AdminSessionReorderList from "@/components/AdminSessionReorderList";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const books = await prisma.book.findMany({
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          sessions: {
            orderBy: [
              { orderInBook: "asc" },
              { createdAt: "asc" },
            ],
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl">لوحة تحكم الإدارة</h1>
        <AdminAddBookForm />
      </div>

      {books.length === 0 && (
        <p className="text-sm text-majalis-ink/60">
          لا توجد كتب بعد. أضف أول كتاب.
        </p>
      )}

      {books.map((book) => (
        <div
          key={book.id}
          className="mb-6 rounded-xl border border-majalis-gold/30 bg-majalis-card p-4"
        >
          <div className="mb-3 flex items-center justify-between border-b border-majalis-gold/20 pb-3">
            <div>
              <span className="font-display text-lg">{book.title}</span>

              <span
                className={`mr-2 rounded-full px-2 py-0.5 text-[10px] ${
                  book.status === "PUBLISHED"
                    ? "bg-green-200"
                    : "bg-amber-200"
                }`}
              >
                {book.status === "PUBLISHED"
                  ? "منشور"
                  : book.status === "SCHEDULED"
                  ? "مجدول"
                  : "مسودة"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/books/${book.slug}`}
                className="text-xs text-majalis-ink/60 hover:text-majalis-gold underline"
              >
                معاينة الكتاب
              </Link>
              <PublishToggle bookId={book.id} status={book.status} />
            </div>
          </div>

          {book.sections.map((section) => (
            <div
              key={section.id}
              className="mb-4 rounded-xl border border-majalis-gold/20 bg-majalis-beige/50 p-3.5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-majalis-ink">
                  {section.title}
                </span>

                <AdminAddSessionButton
                  bookSectionId={section.id}
                  nextOrder={
                    Math.max(
                      0,
                      ...section.sessions.map((s) => s.orderInBook)
                    ) + 1
                  }
                />
              </div>

              <AdminSessionReorderList
                sectionId={section.id}
                initialSessions={section.sessions}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function PublishToggle({
  bookId,
  status,
}: {
  bookId: string;
  status: string;
}) {
  return (
    <Link
      href={`/admin/books/${bookId}`}
      className="text-xs text-majalis-gold underline"
    >
      {status === "PUBLISHED" ? "إدارة النشر" : "نشر الكتاب"}
    </Link>
  );
}
