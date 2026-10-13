import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminAddBookForm from "@/components/AdminAddBookForm";
import AdminAddSessionButton from "@/components/AdminAddSessionButton";

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
          <div className="mb-2 flex items-center justify-between">
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

            <PublishToggle bookId={book.id} status={book.status} />
          </div>

          {book.sections.map((section) => (
            <div
              key={section.id}
              className="mb-3 rounded-lg border border-majalis-gold/20 bg-majalis-beige p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-majalis-ink/60">
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

              <div className="flex flex-col gap-1.5">
                {section.sessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/sessions/${s.id}/edit`}
                    className="flex items-center justify-between rounded-lg bg-majalis-card px-3 py-2 text-sm hover:border-majalis-gold"
                  >
                    <span>
                      <span className="ml-2 text-majalis-gold">
                        {s.orderInBook}.
                      </span>
                      {s.title}
                    </span>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        s.status === "PUBLISHED"
                          ? "bg-green-200"
                          : "bg-amber-200"
                      }`}
                    >
                      {s.status === "PUBLISHED" ? "منشور" : "مسودة"}
                    </span>
                  </Link>
                ))}

                {section.sessions.length === 0 && (
                  <p className="text-xs text-majalis-ink/50">
                    لا توجد مجالس في هذا الباب بعد.
                  </p>
                )}
              </div>
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
