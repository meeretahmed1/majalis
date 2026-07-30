"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminBookEditPage({ params }: { params: { bookId: string } }) {
  const router = useRouter();
  const [book, setBook] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/books/${params.bookId}`).then((r) => r.json()).then(setBook);
  }, [params.bookId]);

  if (!book) return <p className="text-sm text-majalis-ink/60">جارٍ التحميل...</p>;

  const save = async (patch: any) => {
    const res = await fetch(`/api/books/${params.bookId}`, {
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
    <div className="mx-auto max-w-xl">
      <h1 className="font-display mb-4 text-xl">تحرير: {book.title}</h1>

      <div className="mb-3 rounded-xl border border-majalis-gold/30 bg-majalis-card p-4">
        <label className="mb-1 block text-xs text-majalis-ink/60">عنوان الكتاب</label>
        <input
          defaultValue={book.title}
          onBlur={(e) => save({ title: e.target.value })}
          className="mb-3 w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2 text-sm"
        />
        <label className="mb-1 block text-xs text-majalis-ink/60">النبذة</label>
        <textarea
          defaultValue={book.description}
          onBlur={(e) => save({ description: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2 text-sm"
        />
      </div>

      <div className="rounded-xl border border-majalis-gold/30 bg-majalis-card p-4">
        <p className="mb-2 text-sm">
          الحالة الحالية: <b>{book.status === "PUBLISHED" ? "منشور" : "مسودة"}</b>
        </p>
        {book.status !== "PUBLISHED" ? (
          <button
            onClick={() => save({ status: "PUBLISHED", publishedAt: new Date().toISOString() })}
            className="rounded-lg bg-majalis-green px-4 py-2 text-sm text-majalis-goldSoft"
          >
            نشر الكتاب الآن
          </button>
        ) : (
          <button onClick={() => save({ status: "DRAFT" })} className="rounded-lg border border-majalis-gold/40 px-4 py-2 text-sm">
            إعادة إلى مسودة
          </button>
        )}
        {saved && <span className="mr-3 text-xs text-majalis-ink/60">تم الحفظ ✓</span>}
      </div>
    </div>
  );
}
