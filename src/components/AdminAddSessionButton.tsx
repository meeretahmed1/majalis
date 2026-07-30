"use client";

import { useRouter } from "next/navigation";

export default function AdminAddSessionButton({ bookSectionId, nextOrder }: { bookSectionId: string; nextOrder: number }) {
  const router = useRouter();

  const add = async () => {
    const title = "مجلس جديد";
    const slug = `session-${Date.now()}`;
    const res = await fetch("/api/admin/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookSectionId, title, slug, orderInBook: nextOrder }),
    });
    if (res.ok) {
      const session = await res.json();
      router.push(`/admin/sessions/${session.id}/edit`);
    }
  };

  return (
    <button onClick={add} className="rounded-lg bg-majalis-gold px-3 py-1.5 text-sm">
      + مجلس جديد
    </button>
  );
}
