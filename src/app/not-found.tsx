import Link from "next/link";
import { BookOpen, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-majalis-gold/20 text-majalis-gold mb-4">
        <span className="font-display text-2xl font-bold">٤٠٤</span>
      </div>
      <h1 className="font-display text-2xl font-bold text-majalis-ink">
        الصفحة غير موجودة
      </h1>
      <p className="mt-2 text-sm text-majalis-ink/70 max-w-md">
        عذراً، لم نتمكن من العثور على المجلس أو الصفحة المطلوبة. ربما تم نقلها أو تغير مسارها.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-majalis-green px-4 py-2 text-xs font-medium text-majalis-goldSoft shadow hover:bg-majalis-green/90 transition-all"
        >
          <Home className="h-4 w-4" />
          <span>الرئيسية</span>
        </Link>
        <Link
          href="/library"
          className="inline-flex items-center gap-2 rounded-xl border border-majalis-gold/40 bg-majalis-card px-4 py-2 text-xs font-medium text-majalis-ink hover:border-majalis-gold transition-all"
        >
          <BookOpen className="h-4 w-4 text-majalis-gold" />
          <span>المكتبة التراثية</span>
        </Link>
      </div>
    </div>
  );
}
