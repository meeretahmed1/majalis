"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminAddSessionButton({
  bookSectionId,
  nextOrder,
}: {
  bookSectionId: string;
  nextOrder: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const add = async () => {
    const input = window.prompt(
      `اختاري ترتيب المجلس الجديد من 1 إلى ${nextOrder}\n\n` +
      `لو عايزة تضيفيه في الآخر، اكتبي ${nextOrder}`,
      String(nextOrder)
    );

    // لو المستخدم ضغط Cancel
    if (input === null) return;

    const order = Number(input.trim());

    // التأكد من صحة رقم الترتيب
    if (
      input.trim() === "" ||
      !Number.isInteger(order) ||
      order < 1 ||
      order > nextOrder
    ) {
      alert(`من فضلك اكتبي رقم صحيح من 1 إلى ${nextOrder}`);
      return;
    }

    setLoading(true);

    try {
      const title = "مجلس جديد";
      const slug = `session-${Date.now()}`;

      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookSectionId,
          title,
          slug,
          orderInBook: order,
        }),
      });

      if (!res.ok) {
        throw new Error("حدث خطأ أثناء إضافة المجلس");
      }

      const session = await res.json();

      router.push(`/admin/sessions/${session.id}/edit`);
      router.refresh();
    } catch (error) {
      alert("حدث خطأ أثناء إضافة المجلس. حاولي مرة أخرى.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={add}
      disabled={loading}
      className="rounded-lg bg-majalis-gold px-3 py-1.5 text-sm disabled:opacity-50"
    >
      {loading ? "جاري الإضافة..." : "+ مجلس جديد"}
    </button>
  );
}
