"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    else router.push("/");
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display mb-4 text-xl">تسجيل الدخول</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
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
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="rounded-lg border border-majalis-gold/30 bg-majalis-card p-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="rounded-lg bg-majalis-green py-2 text-sm text-majalis-goldSoft">دخول</button>
      </form>
      <p className="mt-3 text-sm text-majalis-ink/60">
        لا تملك حساباً؟ <Link href="/register" className="text-majalis-gold underline">أنشئ حساباً جديداً</Link>
      </p>
    </div>
  );
}
