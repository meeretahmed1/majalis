"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VisualMindMap } from "./VisualMindMap";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Printer,
  BookOpen,
  Sparkles,
  Check,
  CheckCircle2,
  Bookmark,
  Eye,
  Sliders,
  Volume2,
} from "lucide-react";

const TABS = [
  { key: "content", label: "المحتوى والتفريغ" },
  { key: "summary", label: "الملخص والأفكار" },
  { key: "mindmap", label: "الخريطة الذهنية" },
  { key: "flashcards", label: "بطاقات الاستحضار" },
  { key: "quiz", label: "اختبار الفهم" },
  { key: "notes", label: "ملاحظاتي" },
  { key: "reflections", label: "خواطري" },
  { key: "questions", label: "أسئلتي" },
  { key: "life", label: "من العلم إلى الحياة" },
] as const;

type TabKey = typeof TABS[number]["key"];

async function api(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "حدث خطأ");
  return res.json();
}

export default function SessionTabs({ bookSlug, session, prevSession, nextSession }: any) {
  const { data: authSession } = useSession();
  const [tab, setTab] = useState<TabKey>("content");
  const [toast, setToast] = useState("");
  const [zenMode, setZenMode] = useState(false);

  // Sync with localStorage for "أكمل من حيث توقفت"
  useEffect(() => {
    if (session?.title && bookSlug) {
      localStorage.setItem(
        "majalis_last_session",
        JSON.stringify({
          bookSlug,
          bookTitle: session.bookSection?.book?.title || "كتاب تراثي",
          sessionTitle: session.title,
          sessionSlug: session.slug,
          progressPercent: 40,
        })
      );
    }
  }, [bookSlug, session]);

  const flashToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2400);
  };

  const isYoutube = session.videoUrl?.includes("youtube") || session.videoUrl?.includes("youtu.be");
  const ytId = isYoutube ? session.videoUrl.match(/(?:v=|youtu\.be\/)([^&]+)/)?.[1] : null;

  const markCompleted = async () => {
    if (!authSession) {
      flashToast("أُنجز المجلس محلياً ✓ (سجّل الدخول لحفظه في حسابك)");
      return;
    }
    await api(`/api/sessions/${session.id}/progress`, {
      method: "POST",
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    flashToast("أُنجز المجلس وتم تحديث تقدّمك الدراسي ✓");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Screen & Printable Header */}
      <div className="print:hidden">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Link
            href={`/books/${bookSlug}`}
            className="inline-flex items-center gap-1 text-xs text-majalis-ink/60 hover:text-majalis-gold transition-colors"
          >
            <span>→ رجوع إلى فهرس الكتاب</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-majalis-gold/30 bg-majalis-card px-2.5 py-1 text-xs text-majalis-ink/75 hover:border-majalis-gold hover:text-majalis-ink transition-colors"
              title="طباعة كراسة المجلس الدراسي بصيغة مرتبة للدفتر"
            >
              <Printer className="h-3.5 w-3.5 text-majalis-gold" />
              <span>طباعة كراسة المجلس</span>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h1 className="font-display text-2xl font-bold text-majalis-ink">{session.title}</h1>
          <p className="mt-1 text-xs text-majalis-ink/60">
            {session.bookSection?.book?.title && (
              <span className="font-medium text-majalis-gold ml-1">
                {session.bookSection.book.title} ·
              </span>
            )}
            {session.date} · المدة: {session.duration || "٣٥ دقيقة"}
          </p>
        </div>

        {/* Sticky Audio Player Bar */}
        <StickyAudioPlayer
          sessionTitle={session.title}
          videoUrl={session.videoUrl}
          durationText={session.duration}
        />

        {toast && (
          <div className="mb-3 rounded-xl border border-majalis-gold/50 bg-majalis-gold/20 px-4 py-2.5 text-sm font-medium text-majalis-ink animate-in fade-in">
            {toast}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
                tab === t.key
                  ? "border-majalis-gold bg-majalis-gold text-majalis-ink shadow-sm"
                  : "border-majalis-gold/30 bg-majalis-card hover:bg-majalis-beige/40 text-majalis-ink/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content Panel */}
      <div className="mb-4 min-h-[220px] rounded-2xl border border-majalis-gold/30 bg-majalis-card p-5 shadow-sm print:hidden">
        {tab === "content" && (
          <div>
            {/* Top Toolbar inside Content: Zen Mode Toggle & Video */}
            <div className="mb-4 flex items-center justify-between border-b border-majalis-gold/20 pb-3">
              <span className="text-xs font-medium text-majalis-gold">
                التفريغ المنهجي للمجلس العلمي
              </span>
              <button
                onClick={() => setZenMode(!zenMode)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                  zenMode
                    ? "border-majalis-gold bg-majalis-gold text-majalis-ink"
                    : "border-majalis-gold/30 bg-majalis-beige/50 text-majalis-ink/70 hover:border-majalis-gold"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>{zenMode ? "الخروج من وضع القراءة" : "وضع القراءة التراثي"}</span>
              </button>
            </div>

            {/* Video preview if available and not in zen mode */}
            {!zenMode && (
              <>
                {ytId ? (
                  <div className="relative mb-5 aspect-video overflow-hidden rounded-xl shadow-sm border border-majalis-gold/20">
                    <iframe
                      title="session-video"
                      src={`https://www.youtube.com/embed/${ytId}`}
                      className="absolute inset-0 h-full w-full border-0"
                      allowFullScreen
                    />
                  </div>
                ) : session.videoUrl ? (
                  <p className="mb-4 rounded-lg bg-majalis-beige/40 p-3 text-xs">
                    🎥 رابط الفيديو الخارجي:{" "}
                    <a
                      href={session.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-majalis-gold underline font-medium"
                    >
                      فتح في نافذة جديدة
                    </a>
                  </p>
                ) : null}
              </>
            )}

            {/* Text content with Zen reading mode styles */}
            <div
              className={`transition-all duration-300 ${
                zenMode
                  ? "rounded-2xl bg-[#FAF6EE] text-[#241F18] p-6 sm:p-10 border border-[#DFCBB5] shadow-inner max-w-2xl mx-auto"
                  : ""
              }`}
            >
              {zenMode && (
                <div className="text-center mb-6">
                  <div className="text-sm font-display text-majalis-gold">بسم الله الرحمن الرحيم</div>
                  <div className="text-xs text-majalis-ink/50 mt-1">❧ ❧ ❧</div>
                </div>
              )}

              <p
                className={`whitespace-pre-wrap leading-relaxed ${
                  zenMode
                    ? "font-serif text-base sm:text-lg leading-loose sm:leading-[2.5rem]"
                    : "text-sm leading-8 text-majalis-ink/90"
                }`}
              >
                {session.textContent}
              </p>

              {zenMode && (
                <div className="text-center mt-8 text-xs text-majalis-ink/50">
                  ❧ ❧ ❧
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-majalis-gold/20 pt-4">
              <button
                onClick={markCompleted}
                className="inline-flex items-center gap-2 rounded-xl bg-majalis-green px-4 py-2 text-xs sm:text-sm font-medium text-majalis-goldSoft shadow hover:bg-majalis-green/90 transition-all"
              >
                <Check className="h-4 w-4" />
                <span>إنهاء المجلس وتحديث تقدّمي</span>
              </button>

              <button
                onClick={() => setTab("mindmap")}
                className="text-xs text-majalis-gold hover:underline font-medium"
              >
                الانتقال إلى الخريطة الذهنية ←
              </button>
            </div>
          </div>
        )}

        {tab === "summary" && <SummaryView summary={session.summary} />}
        {tab === "mindmap" && (
          <VisualMindMap
            outline={session.mindMap?.nodesJson?.outline}
            sessionTitle={session.title}
            bookTitle={session.bookSection?.book?.title}
          />
        )}
        {tab === "flashcards" && (
          <FlashcardsView
            sessionId={session.id}
            cards={session.flashcards}
            authed={!!authSession}
            flashToast={flashToast}
          />
        )}
        {tab === "quiz" && (
          <QuizView sessionId={session.id} questions={session.quizQuestions} authed={!!authSession} />
        )}
        {tab === "notes" && (
          <JournalView
            kind="notes"
            sessionId={session.id}
            authed={!!authSession}
            placeholder="اكتب ملاحظاتك أثناء دراسة هذا المجلس..."
          />
        )}
        {tab === "reflections" && (
          <JournalView
            kind="reflections"
            sessionId={session.id}
            authed={!!authSession}
            placeholder="ما الذي أثّر فيك؟ وما الذي تريد تطبيقه في حياتك؟"
          />
        )}
        {tab === "questions" && (
          <QuestionsView sessionId={session.id} authed={!!authSession} />
        )}
        {tab === "life" && (
          <LifeView
            sessionId={session.id}
            apps={session.lifeApplications}
            authed={!!authSession}
            flashToast={flashToast}
          />
        )}
      </div>

      {/* Navigation Between Sessions */}
      <div className="mb-4 flex gap-2 print:hidden">
        <NavButton bookSlug={bookSlug} target={prevSession} fallback="لا يوجد مجلس سابق" dir="prev" />
        <NavButton bookSlug={bookSlug} target={nextSession} fallback="لا يوجد مجلس تالٍ" dir="next" />
      </div>

      {/* Linked Cross-Sessions */}
      {session.linksFrom?.length > 0 && (
        <div className="flex flex-col gap-2 print:hidden">
          <div className="text-xs font-semibold text-majalis-gold mb-1">مجالس ذات صلة:</div>
          {session.linksFrom.map((l: any) => (
            <Link
              key={l.id}
              href={`/books/${bookSlug}/sessions/${l.linkedSession.slug}`}
              className="rounded-xl border border-majalis-gold/30 bg-majalis-card p-3 text-sm hover:border-majalis-gold transition-colors"
            >
              <span className="ml-2 text-xs font-medium text-majalis-gold">
                [{linkTypeLabel(l.linkType)}]
              </span>
              {l.linkedSession.title}
            </Link>
          ))}
        </div>
      )}

      {/* PRINTABLE HANDOUT (Visible only during window.print()) */}
      <div className="hidden print:block font-serif text-black p-6 space-y-6">
        <div className="border-b-2 border-black pb-4 text-center">
          <div className="text-xs">كراسة مدارسة المجلس العلمي</div>
          <h1 className="text-2xl font-bold mt-1">{session.title}</h1>
          <div className="text-sm mt-1">
            كتاب: {session.bookSection?.book?.title || "كتاب تراثي"} · المدة: {session.duration}
          </div>
          <div className="mt-3 flex justify-around text-xs border-t border-dashed border-gray-400 pt-2">
            <div>اسم الطالب: .......................................</div>
            <div>تاريخ المدارسة: .......................................</div>
          </div>
        </div>

        {/* Outline & Key Ideas */}
        {session.summary && (
          <div>
            <h2 className="text-base font-bold border-b border-gray-400 pb-1 mb-2">
              أولاً: ملخص المجلس وأهم الأفكار
            </h2>
            <ul className="list-disc pr-6 text-sm leading-relaxed space-y-1">
              {(session.summary.keyIdeas || []).map((idea: string, i: number) => (
                <li key={i}>{idea}</li>
              ))}
            </ul>

            {session.summary.terms?.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-bold text-gray-800">المصطلحات والتعريفات:</h3>
                <ul className="list-circle pr-6 text-xs leading-relaxed space-y-1 mt-1">
                  {session.summary.terms.map((term: string, i: number) => (
                    <li key={i}>{term}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Practical Life Applications */}
        {session.lifeApplications?.length > 0 && (
          <div>
            <h2 className="text-base font-bold border-b border-gray-400 pb-1 mb-2">
              ثانياً: من العلم إلى العمل (التطبيقات الحياتية)
            </h2>
            <div className="space-y-2">
              {session.lifeApplications.map((app: any, i: number) => (
                <div key={i} className="border border-gray-300 p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border border-black" />
                    <span className="font-bold">{app.title}</span>
                  </div>
                  <p className="mt-1 text-gray-700 pr-6">{app.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Notes Writing Space */}
        <div>
          <h2 className="text-base font-bold border-b border-gray-400 pb-1 mb-2">
            ثالثاً: الفوائد والخواطر الخاصة
          </h2>
          <div className="h-44 border border-gray-300 p-3 text-xs text-gray-400">
            مساحة مخصصة لكتابة ملاحظاتك وتأملاتك أثناء الاستماع إلى المجلس...
          </div>
        </div>
      </div>
    </div>
  );
}

// Sticky Audio Player with playback speeds and jump controls
function StickyAudioPlayer({
  sessionTitle,
  durationText,
}: {
  sessionTitle: string;
  videoUrl?: string;
  durationText?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const totalSeconds = 35 * 60; // Standard 35 min session duration

  // Audio timer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => (prev >= totalSeconds ? 0 : prev + 1));
      }, 1000 / speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, totalSeconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const jump = (delta: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(totalSeconds, prev + delta)));
  };

  return (
    <div className="mb-4 rounded-2xl border border-majalis-gold/40 bg-gradient-to-r from-majalis-card via-majalis-beige/30 to-majalis-card p-3.5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Track Title & Speaker */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isPlaying
                ? "bg-majalis-green text-majalis-goldSoft shadow"
                : "bg-majalis-gold/20 text-majalis-gold"
            }`}
          >
            <Volume2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-majalis-gold uppercase tracking-wider">
              المسار الصوتي للمجلس
            </div>
            <div className="font-display text-sm font-bold text-majalis-ink truncate">
              {sessionTitle}
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* -15s Button */}
          <button
            onClick={() => jump(-15)}
            className="flex items-center gap-1 rounded-lg border border-majalis-gold/30 bg-majalis-card p-1.5 text-xs text-majalis-ink/70 hover:border-majalis-gold hover:text-majalis-ink transition-colors"
            title="رجوع ١٥ ثانية"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-[10px] font-mono">15s</span>
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-majalis-green text-majalis-goldSoft shadow hover:bg-majalis-green/90 transition-all"
            title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>

          {/* +15s Button */}
          <button
            onClick={() => jump(15)}
            className="flex items-center gap-1 rounded-lg border border-majalis-gold/30 bg-majalis-card p-1.5 text-xs text-majalis-ink/70 hover:border-majalis-gold hover:text-majalis-ink transition-colors"
            title="تقديم ١٥ ثانية"
          >
            <RotateCw className="h-4 w-4" />
            <span className="text-[10px] font-mono">15s</span>
          </button>

          {/* Speed Selector */}
          <div className="relative">
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="rounded-lg border border-majalis-gold/30 bg-majalis-card px-2 py-1.5 text-xs font-mono font-medium text-majalis-ink focus:border-majalis-gold focus:outline-none cursor-pointer"
            >
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress scrub bar */}
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[11px] text-majalis-ink/60 min-w-8">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={totalSeconds}
          value={currentTime}
          onChange={(e) => setCurrentTime(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-majalis-sand/40 accent-majalis-gold"
        />
        <span className="font-mono text-[11px] text-majalis-ink/60 min-w-8">
          {formatTime(totalSeconds)}
        </span>
      </div>
    </div>
  );
}

function linkTypeLabel(type: string) {
  return (
    {
      PREREQUISITE: "يُراجَع قبله",
      COMPLEMENTARY: "يكمّل الفكرة",
      SIMILAR: "مفهوم مشابه",
      OPPOSING_VIEW: "رأي آخر",
      CROSS_BOOK: "من كتاب آخر",
    } as Record<string, string>
  )[type] ?? type;
}

function NavButton({ bookSlug, target, fallback, dir }: any) {
  if (!target)
    return (
      <div className="flex-1 rounded-xl border border-majalis-gold/20 p-2.5 text-center text-xs text-majalis-ink/40">
        {fallback}
      </div>
    );
  return (
    <Link
      href={`/books/${bookSlug}/sessions/${target.slug}`}
      className="flex-1 rounded-xl border border-majalis-gold/30 bg-majalis-card p-2.5 text-center text-xs font-medium hover:border-majalis-gold hover:text-majalis-gold transition-colors"
    >
      {dir === "prev" ? "→ " : ""}
      {target.title}
      {dir === "next" ? " ←" : ""}
    </Link>
  );
}

function SummaryView({ summary }: any) {
  if (!summary) return <p className="text-sm text-majalis-ink/60">لا يوجد ملخص بعد.</p>;
  const Block = ({ title, items }: { title: string; items: string[] }) =>
    items?.length > 0 && (
      <div className="mb-4">
        <div className="mb-1.5 text-xs font-bold text-majalis-gold uppercase tracking-wider">
          {title}
        </div>
        <ul className="list-disc pr-5 text-sm leading-7 space-y-1">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </div>
    );
  return (
    <div className="space-y-2">
      <Block title="أهم الأفكار" items={summary.keyIdeas} />
      <Block title="التعريفات والمصطلحات" items={summary.terms} />
      <Block title="الأدلة الشرعية والعقلية" items={summary.evidences} />
      <Block title="الفوائد المستفادة" items={summary.benefits} />
      <Block title="نقاط تحتاج مراجعة واستحضاراً" items={summary.reviewPoints} />
    </div>
  );
}

// Upgraded Spaced Repetition Flashcards with Leitner Intervals
function FlashcardsView({ sessionId, cards, authed, flashToast }: any) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [completedAll, setCompletedAll] = useState(false);

  if (!cards?.length)
    return <p className="text-sm text-majalis-ink/60">لا توجد بطاقات لهذا المجلس بعد.</p>;

  const card = cards[i];

  const rate = async (difficulty: "EASY" | "MEDIUM" | "HARD") => {
    if (authed) {
      api(`/api/sessions/${sessionId}/flashcard-reviews`, {
        method: "POST",
        body: JSON.stringify({ flashcardId: card.id, difficulty }),
      }).catch(() => {});
    }

    if (difficulty === "EASY") {
      setMasteredCount((c) => c + 1);
    }

    const nextIndex = i + 1;
    if (nextIndex >= cards.length) {
      setCompletedAll(true);
      flashToast("أحسنت! أتممت مراجعة جميع بطاقات هذا المجلس ✓");
    } else {
      setI(nextIndex);
      setFlipped(false);
    }
  };

  const restart = () => {
    setI(0);
    setFlipped(false);
    setCompletedAll(false);
  };

  if (completedAll) {
    return (
      <div className="text-center py-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-3">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="font-display text-lg font-bold text-majalis-ink">
          أتممت جولة استحضار بطاقات هذا المجلس!
        </h3>
        <p className="text-xs text-majalis-ink/70 mt-1 max-w-sm mx-auto">
          تم تحديث جدول المراجعة المتباعدة. ستُعرض عليك البطاقات الصعبة في وقت أقرب لتثبيت الفهم.
        </p>
        <button
          onClick={restart}
          className="mt-4 rounded-xl border border-majalis-gold/40 bg-majalis-gold px-4 py-2 text-xs font-medium text-majalis-ink hover:bg-majalis-gold/90 transition-all"
        >
          إعادة المراجعة الآن
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress & Counter */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-majalis-ink/70">
            بطاقة {i + 1} من {cards.length}
          </span>
          <span className="rounded bg-majalis-gold/20 px-2 py-0.5 text-[10px] font-medium text-majalis-gold">
            نظام لايتنر للتكرار المتباعد
          </span>
        </div>
        <div className="h-1.5 w-24 rounded-full bg-majalis-sand/40 overflow-hidden">
          <div
            className="h-full bg-majalis-gold transition-all"
            style={{ width: `${((i + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Tactile Flip Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className={`group relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border p-6 text-center shadow-sm transition-all duration-300 ${
          flipped
            ? "border-majalis-gold/70 bg-gradient-to-br from-majalis-card to-majalis-beige/40 shadow-md"
            : "border-majalis-gold/30 bg-majalis-beige/50 hover:border-majalis-gold"
        }`}
      >
        <span className="text-[10px] font-semibold tracking-wider text-majalis-gold mb-2 uppercase">
          {flipped ? "الجواب والبيان" : "السؤال والاستحضار"}
        </span>
        <p className="font-display text-base sm:text-lg leading-relaxed text-majalis-ink font-medium max-w-lg">
          {flipped ? card.back : card.front}
        </p>
        <span className="mt-3 text-[11px] text-majalis-ink/40">
          {flipped ? "اضغط لقلب الوجه مجدداً" : "اضغط على البطاقة لكشف الجواب"}
        </span>
      </div>

      {/* Leitner Spaced Repetition Buttons */}
      {flipped ? (
        <div className="mt-4">
          <div className="text-[11px] text-center text-majalis-ink/60 mb-2 font-medium">
            كيف كان استحضارك للجواب؟
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => rate("HARD")}
              className="flex flex-col items-center rounded-xl border border-red-300 bg-red-500/10 py-2.5 px-2 hover:bg-red-500/20 transition-colors"
            >
              <span className="text-xs font-bold text-red-700 dark:text-red-400">صعب</span>
              <span className="text-[10px] text-red-600/80 dark:text-red-300 mt-0.5">مراجعة غداً (١ يوم)</span>
            </button>
            <button
              onClick={() => rate("MEDIUM")}
              className="flex flex-col items-center rounded-xl border border-amber-300 bg-amber-500/10 py-2.5 px-2 hover:bg-amber-500/20 transition-colors"
            >
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">متوسط</span>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-300 mt-0.5">بعد ٣ أيام</span>
            </button>
            <button
              onClick={() => rate("EASY")}
              className="flex flex-col items-center rounded-xl border border-emerald-300 bg-emerald-500/10 py-2.5 px-2 hover:bg-emerald-500/20 transition-colors"
            >
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">سهل</span>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-300 mt-0.5">بعد أسبوع (٧ أيام)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-center">
          <button
            onClick={() => setFlipped(true)}
            className="text-xs text-majalis-gold hover:underline font-medium"
          >
            كشف الجواب ←
          </button>
        </div>
      )}
    </div>
  );
}

function QuizView({ sessionId, questions, authed }: any) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  if (!questions?.length)
    return <p className="text-sm text-majalis-ink/60">لا يوجد اختبار لهذا المجلس بعد.</p>;

  const submit = async () => {
    if (!authed) {
      // Guest local evaluation
      let correct = 0;
      const resList = questions.map((q: any) => {
        const userAns = answers[q.id];
        const isRight = userAns === q.correctAnswer;
        if (isRight) correct++;
        return {
          quizQuestionId: q.id,
          userAnswer: userAns,
          correctAnswer: q.correctAnswer,
          isCorrect: isRight,
          explanation: q.explanation || "مراجعة متقنة للمجلس العلمي.",
        };
      });
      setResult({ score: correct, total: questions.length, results: resList });
      return;
    }
    const payload = {
      answers: Object.entries(answers).map(([quizQuestionId, userAnswer]) => ({
        quizQuestionId,
        userAnswer,
      })),
    };
    const res = await api(`/api/sessions/${sessionId}/quiz-attempts`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setResult(res);
  };

  return (
    <div>
      {questions.map((q: any, qi: number) => {
        const r = result?.results?.find((x: any) => x.quizQuestionId === q.id);
        return (
          <div key={q.id} className="mb-4">
            <p className="mb-2 text-sm font-medium">
              {qi + 1}. {q.question}
            </p>
            <div className="flex flex-col gap-1.5">
              {q.options.map((op: string, oi: number) => {
                const chosen = answers[q.id] === oi;
                let cls = "border-majalis-gold/30";
                if (result) {
                  if (r?.correctAnswer === oi) cls = "bg-green-200 border-green-300 dark:bg-green-900/30";
                  else if (chosen) cls = "bg-red-200 border-red-300 dark:bg-red-900/30";
                } else if (chosen) cls = "bg-majalis-gold border-majalis-gold";
                return (
                  <div
                    key={oi}
                    onClick={() => !result && setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${cls}`}
                  >
                    {op}
                  </div>
                );
              })}
            </div>
            {r && <p className="mt-1 text-xs text-majalis-ink/60">💡 {r.explanation}</p>}
          </div>
        );
      })}
      {!result ? (
        <button
          onClick={submit}
          className="rounded-lg bg-majalis-green px-4 py-2 text-sm text-majalis-goldSoft"
        >
          تسليم الإجابات
        </button>
      ) : (
        <p className="text-sm font-medium">
          نتيجتك: {result.score} / {result.total}
        </p>
      )}
    </div>
  );
}

function JournalView({ kind, sessionId, authed, placeholder }: any) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (authed) {
      api(`/api/sessions/${sessionId}/${kind}`)
        .then((rows) => {
          if (rows[0]) setText(kind === "notes" ? rows[0].contentRichText : rows[0].content);
        })
        .catch(() => {});
    } else {
      const local = localStorage.getItem(`majalis_${kind}_${sessionId}`);
      if (local) setText(local);
    }
  }, [sessionId, kind, authed]);

  const save = async () => {
    if (authed) {
      await api(`/api/sessions/${sessionId}/${kind}`, {
        method: "POST",
        body: JSON.stringify(kind === "notes" ? { contentRichText: text } : { content: text }),
      });
    } else {
      localStorage.setItem(`majalis_${kind}_${sessionId}`, text);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div>
      <textarea
        rows={7}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-majalis-gold/30 bg-majalis-beige/50 p-3 text-sm focus:border-majalis-gold focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={save}
          className="rounded-xl bg-majalis-green px-4 py-1.5 text-xs font-medium text-majalis-goldSoft hover:bg-majalis-green/90 transition-all"
        >
          حفظ الفائدة
        </button>
        {saved && <span className="text-xs text-majalis-gold font-medium">تم الحفظ ✓</span>}
      </div>
      <p className="mt-1 text-xs text-majalis-ink/50">
        خاص بك ولا يظهر لأي مستخدم آخر. يُحفظ في دفترك تلقائياً.
      </p>
    </div>
  );
}

function QuestionsView({ sessionId, authed }: any) {
  const [list, setList] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("PRIVATE");

  const catLabels: Record<string, string> = {
    PRIVATE: "سؤال خاص",
    LATER: "أرجع إليه لاحقاً",
    TO_TEACHER: "أرسله للمدرس",
    ANSWERED: "تمت الإجابة",
    NEEDS_RESEARCH: "يحتاج بحث",
  };

  const load = useCallback(() => {
    if (authed) {
      api(`/api/sessions/${sessionId}/questions`).then(setList).catch(() => {});
    }
  }, [sessionId, authed]);
  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!text.trim() || !authed) return;
    await api(`/api/sessions/${sessionId}/questions`, {
      method: "POST",
      body: JSON.stringify({ content: text.trim(), category }),
    });
    setText("");
    load();
  };

  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب سؤالك أو استشكالك هنا..."
          className="flex-1 rounded-xl border border-majalis-gold/30 bg-majalis-beige/50 p-2.5 text-xs focus:border-majalis-gold focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-majalis-gold/30 bg-majalis-beige/50 p-2 text-xs focus:border-majalis-gold focus:outline-none"
        >
          {Object.entries(catLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button onClick={add} className="rounded-xl bg-majalis-gold px-4 text-xs font-bold text-majalis-ink">
          +
        </button>
      </div>
      {list.length === 0 && (
        <p className="text-xs text-majalis-ink/60">لا توجد أسئلة مسجلة بعد لهذا المجلس.</p>
      )}
      {list.map((q) => (
        <div key={q.id} className="mb-2 rounded-xl border border-majalis-gold/20 bg-majalis-card p-3">
          <span className="text-[10px] font-medium text-majalis-gold">{catLabels[q.category]}</span>
          <p className="text-xs mt-1">{q.content}</p>
          {q.answer && <p className="mt-1 text-xs text-majalis-green">إجابة المدرّس: {q.answer}</p>}
        </div>
      ))}
    </div>
  );
}

function LifeView({ sessionId, apps, authed, flashToast }: any) {
  const [committed, setCommitted] = useState<Record<string, boolean>>({});

  const commit = async (lifeApplicationId: string) => {
    if (authed) {
      await api(`/api/sessions/${sessionId}/life-commitments`, {
        method: "POST",
        body: JSON.stringify({ lifeApplicationId }),
      }).catch(() => {});
    }
    setCommitted((c) => ({ ...c, [lifeApplicationId]: true }));
    flashToast("أُضيف إلى دفتر تطبيقاتك الحية ✓");
  };

  if (!apps?.length)
    return <p className="text-sm text-majalis-ink/60">لا توجد تطبيقات حياتية لهذا المجلس بعد.</p>;

  return (
    <div className="flex flex-col gap-3">
      {apps.map((la: any) => (
        <div
          key={la.id}
          className="rounded-xl border border-majalis-gold/30 bg-majalis-card p-4 transition-all hover:border-majalis-gold"
        >
          <p className="text-sm font-bold text-majalis-ink">{la.title}</p>
          <p className="my-1.5 text-xs text-majalis-ink/75 leading-relaxed">{la.description}</p>
          <button
            onClick={() => commit(la.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              committed[la.id]
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                : "bg-majalis-green text-majalis-goldSoft"
            }`}
          >
            {committed[la.id] ? "✓ مسجل في دفتر التطبيقات" : "سألتزم بتطبيق هذا"}
          </button>
        </div>
      ))}
    </div>
  );
}
