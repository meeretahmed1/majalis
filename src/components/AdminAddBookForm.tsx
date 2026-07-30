"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAddBookForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("مبتدئ");
  const [error, setError] = useState("");

  const slugify = (s: string) =>
    s.trim().replace(/\s+/g, "-").replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, "");

  const submit = async () => {
    setError("");
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: slugify(title) || `book-${Date.now()}`,
        description,
        level,
        goals: [],
        estimatedDuration: "",
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "تعذّر إنشاء الكتاب");
      return;
    }
    setTitle("");
    setDescription("");
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-lg bg-majalis-gold px-4 py-2 text-sm">
        + كتاب جديد
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-majalis-gold/30 bg-majalis-card p-4">
      <input
        placeholder="عنوان الكتاب"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-2 w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2 text-sm"
      />
      <textarea
        placeholder="نبذة مختصرة عن الكتاب"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="mb-2 w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2 text-sm"
      />
      <select value={level} onChange={(e) => setLevel(e.target.value)} className="mb-2 w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2 text-sm">
        <option>مبتدئ</option>
        <option>متوسط</option>
        <option>متقدم</option>
      </select>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={!title.trim()} className="rounded-lg bg-majalis-green px-3 py-1.5 text-sm text-majalis-goldSoft disabled:opacity-40">
          حفظ كمسودة
        </button>
        <button onClick={() => setOpen(false)} className="rounded-lg border border-majalis-gold/30 px-3 py-1.5 text-sm">
          إلغاء
        </button>
      </div>
    </div>
  );
}
