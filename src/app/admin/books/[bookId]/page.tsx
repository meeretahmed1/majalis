"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers } from "lucide-react";
import AdminSessionReorderList from "@/components/AdminSessionReorderList";
import AdminAddSessionButton from "@/components/AdminAddSessionButton";

export default function AdminBookEditPage({
  params,
}: {
  params: Promise<{ bookId: string }> | { bookId: string };
}) {
  const router = useRouter();
  // Safe param unwrapping in Next.js 15
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const bookId = resolvedParams.bookId;

  const [book, setBook] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBook = useCallback(() => {
    fetch(`/api/books/${bookId}?all=true`)
      .then((r) => r.json())
      .then((data) => {
        setBook(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookId]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  if (loading || !book) {
    return <p className="text-sm text-majalis-ink/60">جارٍ التحميل...</p>;
  }

  const save = async (patch: any) => {
    const res = await fetch(`/api/books/${bookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setBook({ ...book, ...patch });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-xs text-majalis-ink/60 hover:text-majalis-gold"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          العودة للوحة الإدارة
        </Link>
        <Link
          href={`/books/${book.slug}`}
          className="flex items-center gap-1 text-xs text-majalis-gold underline"
        >
          <BookOpen className="w-3.5 h-3.5" />
          معاينة في واجهة الطلاب
        </Link>
      </div>

      <h1 className="font-display mb-4 text-2xl font-bold">تحرير الكتاب: {book.title}</h1>

      {/* Book details form */}
      <div className="mb-6 rounded-xl border border-majalis-gold/30 bg-majalis-card p-5">
        <label className="mb-1 block text-xs font-medium text-majalis-ink/70">عنوان الكتاب</label>
        <input
          defaultValue={book.title}
          onBlur={(e) => save({ title: e.target.value })}
          className="mb-4 w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2.5 text-sm"
        />

        <label className="mb-1 block text-xs font-medium text-majalis-ink/70">النبذة والوصف</label>
        <textarea
          defaultValue={book.description}
          onBlur={(e) => save({ description: e.target.value })}
          rows={3}
          className="mb-4 w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2.5 text-sm"
        />

        <div className="flex items-center justify-between border-t border-majalis-gold/20 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-majalis-ink/70">حالة النشر:</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                book.status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {book.status === "PUBLISHED" ? "منشور للجميع" : "مسودة خاصة"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {saved && <span className="text-xs text-green-600 font-medium">تم الحفظ ✓</span>}
            {book.status !== "PUBLISHED" ? (
              <button
                type="button"
                onClick={() => save({ status: "PUBLISHED", publishedAt: new Date().toISOString() })}
                className="rounded-lg bg-majalis-green px-4 py-2 text-xs font-medium text-majalis-goldSoft hover:opacity-90 transition-opacity"
              >
                نشر الكتاب الآن
              </button>
            ) : (
              <button
                type="button"
                onClick={() => save({ status: "DRAFT" })}
                className="rounded-lg border border-majalis-gold/40 px-3 py-1.5 text-xs hover:bg-majalis-beige transition-colors"
              >
                إعادة إلى مسودة
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sections and Sessions Reordering */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display flex items-center gap-2 text-lg font-semibold">
          <Layers className="w-5 h-5 text-majalis-gold" />
          أبواب ومجالس الكتاب
        </h2>
        <span className="text-xs text-majalis-ink/60">
          يمكنك سحب المجالس لإعادة ترتيبها فورياً
        </span>
      </div>

      {book.sections && book.sections.length > 0 ? (
        book.sections.map((section: any) => (
          <div
            key={section.id}
            className="mb-4 rounded-xl border border-majalis-gold/30 bg-majalis-beige/40 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-majalis-ink">
                {section.title}
              </h3>

              <AdminAddSessionButton
                bookSectionId={section.id}
                nextOrder={
                  Math.max(
                    0,
                    ...(section.sessions || []).map((s: any) => s.orderInBook)
                  ) + 1
                }
              />
            </div>

            <AdminSessionReorderList
              sectionId={section.id}
              initialSessions={section.sessions || []}
              onOrderChanged={() => fetchBook()}
            />
          </div>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-majalis-gold/40 p-6 text-center text-sm text-majalis-ink/60">
          لا توجد أبواب مسجلة لهذا الكتاب.
        </div>
      )}
    </div>
  );
}
