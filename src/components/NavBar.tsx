"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalSearch from "@/components/GlobalSearch";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { BookMarked } from "lucide-react";

export default function NavBar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <header className="border-b border-majalis-gold/30 bg-majalis-card sticky top-0 z-40 backdrop-blur-sm bg-majalis-card/95">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-majalis-green text-majalis-goldSoft font-display font-bold">
              م
            </div>
            <div>
              <div className="font-display text-lg leading-none">مجالس</div>
              <div className="text-[10px] text-majalis-ink/60">من المجلس إلى الحياة</div>
            </div>
          </Link>
          <GlobalSearch />
        </div>

        <nav className="flex items-center gap-2 sm:gap-3 text-sm">
          <Link href="/library" className="hover:text-majalis-gold transition-colors">
            المكتبة
          </Link>
          <Link href="/notebook" className="flex items-center gap-1 hover:text-majalis-gold transition-colors">
            <BookMarked className="h-3.5 w-3.5 text-majalis-gold" />
            <span>الدفتر</span>
          </Link>
          {session && (
            <Link href="/dashboard" className="hover:text-majalis-gold transition-colors">
              لوحتي
            </Link>
          )}
          {(role === "ADMIN" || role === "TEACHER") && (
            <Link href="/admin" className="hover:text-majalis-gold transition-colors">
              الإدارة
            </Link>
          )}
          <PWAInstallButton />
          <ThemeToggle />
          {session ? (
            <button
              onClick={() => signOut()}
              className="rounded-lg border border-majalis-gold/40 px-2.5 py-1 text-xs hover:border-majalis-gold transition-colors"
            >
              خروج
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-majalis-gold/40 px-2.5 py-1 text-xs hover:border-majalis-gold transition-colors"
            >
              دخول
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
