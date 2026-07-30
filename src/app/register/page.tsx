"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "تعذّر إنشاء الحساب");
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    if (signInRes?.error) setError("تم إنشاء الحساب، لكن تعذّر تسجيل الدخول تلقائياً. جرّب الدخول يدوياً.");
    else router.push("/");
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display mb-4 text-xl">إنشاء حساب جديد</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          placeholder="الاسم"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-lg border border-majalis-gold/30 bg-majalis-card p-2 text-sm"
        />
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-lg border border-majalis-gold/30 bg-majalis-card p-2 text-sm"
        />
        <input
          type="password"
          placeholder="كلمة المرور (8 أحرف على الأقل)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="rounded-lg border border-majalis-gold/30 bg-majalis-card p-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="rounded-lg bg-majalis-green py-2 text-sm text-majalis-goldSoft">إنشاء الحساب</button>
      </form>
      <p className="mt-3 text-sm text-majalis-ink/60">
        لديك حساب بالفعل؟ <Link href="/login" className="text-majalis-gold underline">سجّل الدخول</Link>
      </p>
    </div>
  );
}
