import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Sparkles, BookMarked, ArrowLeft } from "lucide-react";
import {
  DailyWisdomCard,
  ResumeLearningWidget,
  LearningPathsSection,
  PlatformStatsRibbon,
} from "@/components/HomeClientWidgets";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const books = await prisma.book.findMany({
    where: { status: "PUBLISHED" },
    include: { author: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-majalis-gold/40 bg-gradient-to-br from-majalis-card via-majalis-beige/40 to-majalis-card p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-majalis-ink leading-tight">
            من المجلس إلى الحياة
          </h1>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-majalis-ink/80">
            ادرس الكتب التراثية والإسلامية مجلساً مجلساً: استمع للمجالس، لخّص الأفكار، راجع بالخرائط الذهنية وبطاقات الاستحضار، اختبر فهمك، ثم طبّق ما تعلمته واقعاً حياً في حياتك.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/library"
              className="inline-flex items-center gap-2 rounded-xl bg-majalis-green px-5 py-2.5 text-sm font-medium text-majalis-goldSoft shadow hover:bg-majalis-green/90 transition-all"
            >
              <BookOpen className="h-4 w-4" />
              <span>ابدأ رحلة التعلم</span>
            </Link>
            <Link
              href="/notebook"
              className="inline-flex items-center gap-2 rounded-xl border border-majalis-gold/50 bg-majalis-card/80 px-4 py-2.5 text-sm font-medium text-majalis-ink hover:border-majalis-gold transition-all"
            >
              <BookMarked className="h-4 w-4 text-majalis-gold" />
              <span>فوائد</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Ribbon: Daily Wisdom & Resume Learning */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ResumeLearningWidget />
        <DailyWisdomCard />
      </section>

      {/* Featured Books Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-majalis-ink">
              المتون والمصنفات المتاحة
            </h2>
            <p className="text-xs text-majalis-ink/60">
              كتب تراثية معتمدة بمجالسها الصوتية وتفريغاتها المنهجية
            </p>
          </div>
          <Link
            href="/library"
            className="flex items-center gap-1 text-xs font-medium text-majalis-gold hover:underline"
          >
            <span>عرض الكل</span>
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.length === 0 && (
            <p className="text-sm text-majalis-ink/60">
              لا توجد كتب منشورة بعد.
            </p>
          )}
          {books.map((book) => {
            const isImageCover = Boolean(
              book.cover && (book.cover.startsWith("/") || book.cover.startsWith("http"))
            );

            return (
              <Link
                key={book.id}
                href={`/books/${book.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-majalis-gold/30 bg-majalis-card p-4 hover:border-majalis-gold hover:shadow-md transition-all duration-200"
              >
                <div className="flex gap-4">
                  <div className="relative shrink-0 w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden border border-majalis-gold/40 shadow-sm bg-majalis-sand/30 flex items-center justify-center">
                    {isImageCover ? (
                      <Image
                        src={book.cover!}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 80px, 96px"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-4xl">{book.cover ?? "📗"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block rounded bg-majalis-gold/15 px-2 py-0.5 text-[10px] font-medium text-majalis-gold mb-1">
                      {book.level}
                    </span>
                    <h3 className="font-display text-base font-bold text-majalis-ink group-hover:text-majalis-green transition-colors line-clamp-2">
                      {book.title}
                    </h3>
                    <div className="mt-0.5 text-xs text-majalis-ink/60">
                      {book.author?.name}
                    </div>
                    <p className="mt-2 text-xs text-majalis-ink/75 line-clamp-2 leading-relaxed">
                      {book.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-majalis-gold/20 pt-3 text-xs text-majalis-ink/60">
                  <span className="text-majalis-green dark:text-emerald-400 font-medium">
                    مجالس تفاعلية معتمدة
                  </span>
                  <span className="flex items-center gap-1 group-hover:text-majalis-gold transition-colors font-medium">
                    <span>تصفح المجالس</span>
                    <ArrowLeft className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Curated Learning Paths */}
      <LearningPathsSection />

      {/* Platform Stats Ribbon */}
      <PlatformStatsRibbon />
    </div>
  );
}
