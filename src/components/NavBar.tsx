"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function NavBar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <header className="border-b border-majalis-gold/30 bg-majalis-card">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-majalis-green text-majalis-goldSoft">
            م
          </div>
          <div>
            <div className="font-display text-lg leading-none">مجالس</div>
            <div className="text-[10px] text-majalis-ink/60">من المجلس إلى الحياة</div>
          </div>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/library" className="hover:text-majalis-gold">المكتبة</Link>
          {session && <Link href="/dashboard" className="hover:text-majalis-gold">لوحتي</Link>}
          {(role === "ADMIN" || role === "TEACHER") && (
            <Link href="/admin" className="hover:text-majalis-gold">لوحة الإدارة</Link>
          )}
          {session ? (
            <button onClick={() => signOut()} className="rounded-lg border border-majalis-gold/40 px-3 py-1">
              خروج
            </button>
          ) : (
            <Link href="/login" className="rounded-lg border border-majalis-gold/40 px-3 py-1">
              دخول
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
