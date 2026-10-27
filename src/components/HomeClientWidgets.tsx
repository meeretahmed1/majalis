"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Play, ArrowLeft, Copy, Check, Bookmark, BookOpen, GraduationCap, Compass } from "lucide-react";

const DAILY_WISDOMS = [
  {
    text: "مِنْ عَلامَاتِ الاعْتِمَادِ عَلَى العَمَلِ، نُقْصَانُ الرَّجَاءِ عِنْدَ وُجُودِ الزَّلَلِ.",
    author: "ابن عطاء الله السكندري",
    source: "الحكم العطائية — الحكمة ١",
    explanation: "العامل الصادق يرجو رحمة ربه وفضله لا مجرد عمله؛ فإذا زلّ لم يقنط، وإذا أحسن لم يغتر.",
    link: "/books/fadl-al-ilm/sessions/session-1",
  },
  {
    text: "إِرَادَتُكَ التَّجْرِيدَ مَعَ إِقَامَةِ اللهِ إِيَّاكَ فِي الأَسْبَابِ مِنَ الشَّهْوَةِ الخَفِيَّةِ، وَإِرَادَتُكَ الأَسْبَابَ مَعَ إِقَامَةِ اللهِ إِيَّاكَ فِي التَّجْرِيدِ حِطَاطٌ عَنِ الرُّتْبَةِ العَلِيَّةِ.",
    author: "ابن عطاء الله السكندري",
    source: "الحكم العطائية — الحكمة ٢",
    explanation: "الرضا بمقامك الذي أقامه الله لك ومراعاة الحكمة الإلهية في أحوال السالكين.",
    link: "/books/fadl-al-ilm/sessions/session-1",
  },
  {
    text: "أَرِحْ نَفْسَكَ مِنَ التَّدْبِيرِ، فَمَا قَامَ بِهِ غَيْرُكَ عَنْكَ لا تَقُمْ بِهِ أَنْتَ لِنَفْسِكَ.",
    author: "ابن عطاء الله السكندري",
    source: "الحكم العطائية — الحكمة ٤",
    explanation: "السكون إلى كفاية الله تعالى وتدبيره للأرزاق، مع استمرار الطاعة والسعي المشروع.",
    link: "/books/fadl-al-ilm/sessions/session-2",
  },
  {
    text: "مَنْ لَمْ يُقْبِلْ عَلَى اللهِ بِمُلاطَفَاتِ الإِحْسَانِ، قِيدَ إِلَيْهِ بِسَلاسِلِ الامْتِحَانِ.",
    author: "ابن عطاء الله السكندري",
    source: "الحكم العطائية",
    explanation: "العاقل يشكر النعم ويقبل على مولاه طوعاً قبل أن تذكره الشدائد والابتلاءات.",
    link: "/books/fadl-al-ilm",
  },
  {
    text: "العِلْمُ بِلا عَمَلٍ جُنُونٌ، وَالعَمَلُ بِغَيْرِ عِلْمٍ لا يَكُونُ.",
    author: "أبو حامد الغزالي",
    source: "إحياء علوم الدين — كتاب العلم",
    explanation: "العلم وسيلة إلى تزكية النفس والعمل الصالح، فإذا تعطلت ثمرته صار حجة على صاحبه.",
    link: "/books/book-8c380bf3d820",
  },
];

export function DailyWisdomCard() {
  const [wisdom, setWisdom] = useState(DAILY_WISDOMS[0]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Pick wisdom based on day of year
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    const index = dayOfYear % DAILY_WISDOMS.length;
    setWisdom(DAILY_WISDOMS[index]);
  }, []);

  const copyWisdom = () => {
    const text = `«${wisdom.text}»\n— ${wisdom.author} (${wisdom.source})\n\nمن منصة مجالس: من المجلس إلى الحياة`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-majalis-gold/40 bg-gradient-to-br from-majalis-card via-majalis-beige/30 to-majalis-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-majalis-gold">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">حكمة اليوم المنهجية</span>
        </div>
        <button
          onClick={copyWisdom}
          className="flex items-center gap-1 rounded-md border border-majalis-gold/30 bg-majalis-card/80 px-2 py-1 text-[11px] text-majalis-ink/70 hover:border-majalis-gold hover:text-majalis-ink transition-colors"
          title="نسخ الحكمة"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? "تم النسخ" : "مشاركة"}</span>
        </button>
      </div>

      <div className="mt-3">
        <blockquote className="font-display text-lg sm:text-xl font-bold leading-relaxed text-majalis-ink">
          «{wisdom.text}»
        </blockquote>
        <p className="mt-2 text-xs text-majalis-ink/70 leading-normal">
          {wisdom.explanation}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-majalis-gold/20 pt-3 text-xs">
        <span className="font-medium text-majalis-gold">{wisdom.author} · {wisdom.source}</span>
        <Link
          href={wisdom.link}
          className="flex items-center gap-1 text-majalis-green hover:underline font-medium dark:text-emerald-400"
        >
          <span>تدارس المجلس</span>
          <ArrowLeft className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export function ResumeLearningWidget({ featuredBook }: { featuredBook?: any }) {
  const [lastSession, setLastSession] = useState<{
    bookSlug: string;
    bookTitle: string;
    sessionTitle: string;
    sessionSlug: string;
    progressPercent?: number;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("majalis_last_session");
    if (saved) {
      try {
        setLastSession(JSON.parse(saved));
      } catch {
        // ignore error
      }
    }
  }, []);

  const target = lastSession || {
    bookSlug: "fadl-al-ilm",
    bookTitle: "الحكم العطائية لسيدي ابن عطاء الله السكندري",
    sessionTitle: "المجلس ١: علامات الاعتماد على العمل والتجريد والأسباب",
    sessionSlug: "session-1",
    progressPercent: 35,
  };

  return (
    <div className="rounded-2xl border border-majalis-gold/30 bg-majalis-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-majalis-green dark:text-emerald-400">
          <Bookmark className="h-4 w-4" />
          <span className="text-xs font-semibold">أكمل من حيث توقفت</span>
        </div>
        <span className="rounded bg-majalis-gold/20 px-2 py-0.5 text-[10px] font-medium text-majalis-gold">
          المجلس قيد المدارسة
        </span>
      </div>

      <div className="mt-3">
        <h3 className="font-display text-base font-bold text-majalis-ink">
          {target.sessionTitle}
        </h3>
        <p className="mt-1 text-xs text-majalis-ink/60">
          كتاب: {target.bookTitle}
        </p>

        {/* Mini progress bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-majalis-sand/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-majalis-gold transition-all duration-500"
              style={{ width: `${target.progressPercent || 25}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-majalis-ink/60">
            {target.progressPercent || 25}%
          </span>
        </div>
      </div>

      <div className="mt-4">
        <Link
          href={`/books/${target.bookSlug}/sessions/${target.sessionSlug}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-majalis-green px-4 py-2 text-xs font-medium text-majalis-goldSoft hover:bg-majalis-green/90 transition-all shadow-sm"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>متابعة الاستماع والمدارسة</span>
        </Link>
      </div>
    </div>
  );
}

export function LearningPathsSection() {
  const paths = [
    {
      title: "مسار التزكية وبصائر القلوب",
      subtitle: "الحكم العطائية لسيدي ابن عطاء الله السكندري",
      desc: "تربية النفس وتصفية القلب وبناء اليقين وتجريد التوكل على الله تعالى.",
      level: "مبتدئ إلى متوسط",
      sessions: "٤ مجالس محققة",
      badge: "التزكية والإحسان",
      href: "/books/fadl-al-ilm",
      icon: Compass,
      color: "border-amber-500/30 bg-amber-500/5",
    },
    {
      title: "مسار آداب طلب العلم والعلماء",
      subtitle: "إحياء علوم الدين للإمام أبي حامد الغزالي",
      desc: "بناء المنهجية الصحيحة في الطلب، واستشعار شرف العلم، والتفريق بين علم الآخرة وعلم الدنيا.",
      level: "تأسيسي شامل",
      sessions: "٣ مجالس محققة",
      badge: "منهجية الطلب",
      href: "/books/book-8c380bf3d820",
      icon: GraduationCap,
      color: "border-emerald-500/30 bg-emerald-500/5",
    },
    {
      title: "مسار الفقه وبناء الملكة الفقهية",
      subtitle: "شرح فتح القريب المجيب على متن أبي شجاع",
      desc: "ضبط الفروع والأحكام الفقهية وتطبيقات الطهارة والعبادات بدقة وسلاسة استدلالية.",
      level: "فقه شافعي معتمد",
      sessions: "٤ مجالس محققة",
      badge: "الفقه والعبادات",
      href: "/books/fath-al-qareeb",
      icon: BookOpen,
      color: "border-blue-500/30 bg-blue-500/5",
    },
  ];

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-majalis-ink">
            مسارات التعلم المنهجية
          </h2>
          <p className="text-xs text-majalis-ink/60">
            خطط دراسية متكاملة تأخذ بيدك من الفهم النظري إلى العمل والتطبيق
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {paths.map((p, i) => {
          const Icon = p.icon;
          return (
            <Link
              key={i}
              href={p.href}
              className={`group flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${p.color}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-majalis-card px-2 py-0.5 text-[10px] font-medium text-majalis-gold border border-majalis-gold/20">
                    {p.badge}
                  </span>
                  <Icon className="h-4 w-4 text-majalis-ink/60 group-hover:text-majalis-gold transition-colors" />
                </div>

                <h3 className="mt-3 font-display text-base font-bold text-majalis-ink group-hover:text-majalis-green dark:group-hover:text-emerald-400 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-majalis-gold font-medium mt-0.5">
                  {p.subtitle}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-majalis-ink/70">
                  {p.desc}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-majalis-gold/20 pt-3 text-[11px] text-majalis-ink/60">
                <span>{p.sessions}</span>
                <span className="flex items-center gap-1 font-medium text-majalis-green dark:text-emerald-400">
                  <span>دخول المسار</span>
                  <ArrowLeft className="h-3 w-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function PlatformStatsRibbon() {
  return (
    <div className="my-8 rounded-2xl border border-majalis-gold/30 bg-majalis-card/80 p-5 shadow-sm">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
        <div>
          <div className="font-display text-2xl font-bold text-majalis-green dark:text-emerald-400">
            ٣
          </div>
          <div className="mt-1 text-xs text-majalis-ink/70">كتب ومصنفات تراثية</div>
        </div>
        <div>
          <div className="font-display text-2xl font-bold text-majalis-gold">
            ٢٢+
          </div>
          <div className="mt-1 text-xs text-majalis-ink/70">مجلساً صوتياً ومرئياً</div>
        </div>
        <div>
          <div className="font-display text-2xl font-bold text-purple-700 dark:text-purple-400">
            ١٠٠٪
          </div>
          <div className="mt-1 text-xs text-majalis-ink/70">خرائط ذهنية وبصرية</div>
        </div>
        <div>
          <div className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            تفاعلي
          </div>
          <div className="mt-1 text-xs text-majalis-ink/70">تكرار متباعد وكُنّاش فوائد</div>
        </div>
      </div>
    </div>
  );
}
