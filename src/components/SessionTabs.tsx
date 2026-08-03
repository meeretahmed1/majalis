"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TABS = [
  { key: "content", label: "المحتوى" },
  { key: "summary", label: "الملخص" },
  { key: "mindmap", label: "الخريطة الذهنية" },
  { key: "flashcards", label: "البطاقات" },
  { key: "quiz", label: "اختبار قصير" },
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

  const flashToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const isYoutube = session.videoUrl?.includes("youtube") || session.videoUrl?.includes("youtu.be");
  const ytId = isYoutube ? session.videoUrl.match(/(?:v=|youtu\.be\/)([^&]+)/)?.[1] : null;

  const markCompleted = async () => {
    if (!authSession) return flashToast("سجّل الدخول أولاً لحفظ تقدّمك");
    await api(`/api/sessions/${session.id}/progress`, { method: "POST", body: JSON.stringify({ status: "COMPLETED" }) });
    flashToast("أُنجز المجلس ✓");
  };

  return (
    <div>
      <Link href={`/books/${bookSlug}`} className="mb-2 inline-block text-sm text-majalis-ink/60">
        → رجوع إلى فهرس الكتاب
      </Link>
      <h1 className="font-display text-xl">{session.title}</h1>
      <p className="mb-4 text-xs text-majalis-ink/60">{session.date} · {session.duration}</p>

      {toast && (
        <div className="mb-3 rounded-lg bg-majalis-gold px-3 py-2 text-sm font-medium text-majalis-ink">{toast}</div>
      )}

      <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm ${
              tab === t.key ? "border-majalis-gold bg-majalis-gold text-majalis-ink" : "border-majalis-gold/30 bg-majalis-card"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 min-h-[160px] rounded-xl border border-majalis-gold/30 bg-majalis-card p-4">
        {tab === "content" && (
          <div>
            {ytId ? (
              <div className="relative mb-3 aspect-video overflow-hidden rounded-lg">
                <iframe
                  title="session-video"
                  src={`https://www.youtube.com/embed/${ytId}`}
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen
                />
              </div>
            ) : session.videoUrl ? (
              <p className="mb-3 text-sm">
                🎥 <a href={session.videoUrl} target="_blank" className="text-majalis-gold underline">رابط الفيديو</a>
              </p>
            ) : (
              <p className="mb-3 text-sm text-majalis-ink/60">لا يوجد فيديو مرفق لهذا المجلس بعد.</p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-8">{session.textContent}</p>
            <button onClick={markCompleted} className="mt-4 rounded-lg bg-majalis-green px-4 py-2 text-sm text-majalis-goldSoft">
              ✓ إنهاء المجلس وتحديث تقدّمي
            </button>
          </div>
        )}

        {tab === "summary" && <SummaryView summary={session.summary} />}
        {tab === "mindmap" && <MindMapView nodesJson={session.mindMap?.nodesJson} />}
        {tab === "flashcards" && <FlashcardsView sessionId={session.id} cards={session.flashcards} authed={!!authSession} flashToast={flashToast} />}
        {tab === "quiz" && <QuizView sessionId={session.id} questions={session.quizQuestions} authed={!!authSession} />}
        {tab === "notes" && <JournalView kind="notes" sessionId={session.id} authed={!!authSession} placeholder="اكتب ملاحظاتك أثناء دراسة هذا المجلس..." />}
        {tab === "reflections" && <JournalView kind="reflections" sessionId={session.id} authed={!!authSession} placeholder="ما الذي أثّر فيك؟ وما الذي تريد تطبيقه؟" />}
        {tab === "questions" && <QuestionsView sessionId={session.id} authed={!!authSession} />}
        {tab === "life" && <LifeView sessionId={session.id} apps={session.lifeApplications} authed={!!authSession} flashToast={flashToast} />}
      </div>

      <div className="mb-3 flex gap-2">
        <NavButton bookSlug={bookSlug} target={prevSession} fallback="لا يوجد مجلس سابق" dir="prev" />
        <NavButton bookSlug={bookSlug} target={nextSession} fallback="لا يوجد مجلس تالٍ" dir="next" />
      </div>

      {session.linksFrom?.length > 0 && (
        <div className="flex flex-col gap-2">
          {session.linksFrom.map((l: any) => (
            <Link
              key={l.id}
              href={`/books/${bookSlug}/sessions/${l.linkedSession.slug}`}
              className="rounded-lg border border-majalis-gold/30 bg-majalis-card p-2 text-sm"
            >
              <span className="ml-1 text-xs font-medium text-majalis-gold">{linkTypeLabel(l.linkType)}</span>
              {l.linkedSession.title}
            </Link>
          ))}
        </div>
      )}
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
  if (!target) return <div className="flex-1 rounded-lg border border-majalis-gold/20 p-2 text-center text-sm text-majalis-ink/40">{fallback}</div>;
  return (
    <Link
      href={`/books/${bookSlug}/sessions/${target.slug}`}
      className="flex-1 rounded-lg border border-majalis-gold/30 bg-majalis-card p-2 text-center text-sm hover:border-majalis-gold"
    >
      {dir === "prev" ? "→ " : ""}{target.title}{dir === "next" ? " ←" : ""}
    </Link>
  );
}

function SummaryView({ summary }: any) {
  if (!summary) return <p className="text-sm text-majalis-ink/60">لا يوجد ملخص بعد.</p>;
  const Block = ({ title, items }: { title: string; items: string[] }) =>
    items?.length > 0 && (
      <div className="mb-3">
        <div className="mb-1 text-sm font-medium text-majalis-gold">{title}</div>
        <ul className="list-disc pr-5 text-sm leading-7">
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      </div>
    );
  return (
    <div>
      <Block title="أهم الأفكار" items={summary.keyIdeas} />
      <Block title="التعريفات والمصطلحات" items={summary.terms} />
      <Block title="الأدلة" items={summary.evidences} />
      <Block title="الفوائد" items={summary.benefits} />
      <Block title="نقاط تحتاج مراجعة" items={summary.reviewPoints} />
    </div>
  );
}

function parseOutline(nodesJson: any) {
  // نتوقّع نصاً بصيغة مخطط بمسافات بادئة، محفوظاً داخل nodesJson.outline
  const text: string = nodesJson?.outline ?? "";
  const lines = text.split("\n").filter((l) => l.trim());
  const root: any = { title: "", children: [] };
  const stack = [{ node: root, indent: -1 }];
  lines.forEach((line) => {
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const node = { title: line.trim(), children: [] as any[] };
    while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ node, indent });
  });
  return root.children[0] ?? { title: "", children: [] };
}

function MindMapNode({ node, depth }: { node: any; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children?.length > 0;
  return (
    <div style={{ marginRight: depth * 16 }} className="mb-1">
      <div
        onClick={() => hasChildren && setOpen(!open)}
        className={`flex items-center gap-1 rounded-md px-2 py-1 ${hasChildren ? "cursor-pointer" : ""} ${
          depth === 0 ? "bg-majalis-gold font-bold" : ""
        }`}
      >
        {hasChildren && <span className="text-xs">{open ? "▾" : "◂"}</span>}
        <span className={depth === 0 ? "text-base" : "text-sm"}>{node.title}</span>
      </div>
      {open && node.children?.map((c: any, i: number) => <MindMapNode key={i} node={c} depth={depth + 1} />)}
    </div>
  );
}

function MindMapView({ nodesJson }: any) {
  const text = nodesJson?.outline?.trim();

  if (!text) {
    return (
      <p className="text-sm text-majalis-ink/60">
        لا توجد خريطة ذهنية بعد.
      </p>
    );
  }

  return (
    <div
      dir="rtl"
      className="
        max-w-none text-right text-sm leading-8
        text-majalis-ink
        dark:text-stone-100
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-2 border-b border-majalis-gold/30 pb-2 font-display text-2xl font-bold">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-5 rounded-lg bg-majalis-gold px-3 py-2 text-lg font-bold text-majalis-ink">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 font-bold text-majalis-gold">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pr-6">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pr-6">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pr-1">{children}</li>
          ),
          p: ({ children }) => (
            <p className="mb-2">{children}</p>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-r-4 border-majalis-gold bg-majalis-beige px-4 py-2 dark:bg-stone-800">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-majalis-green dark:text-majalis-goldSoft">
              {children}
            </strong>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function FlashcardsView({ sessionId, cards, authed, flashToast }: any) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  if (!cards?.length) return <p className="text-sm text-majalis-ink/60">لا توجد بطاقات لهذا المجلس بعد.</p>;
  const card = cards[i];

  const rate = async (difficulty: "EASY" | "MEDIUM" | "HARD") => {
    if (!authed) return flashToast("سجّل الدخول لحفظ تقدّم مراجعتك");
    await api(`/api/sessions/${sessionId}/flashcard-reviews`, { method: "POST", body: JSON.stringify({ flashcardId: card.id, difficulty }) });
    setFlipped(false);
    setI((v) => (v + 1) % cards.length);
  };

  return (
    <div>
      <p className="mb-2 text-xs text-majalis-ink/60">بطاقة {i + 1} من {cards.length}</p>
      <div
        onClick={() => setFlipped(!flipped)}
        className="flex min-h-[110px] cursor-pointer items-center justify-center rounded-lg border border-majalis-gold/30 bg-majalis-beige p-5 text-center text-sm"
      >
        {flipped ? card.back : card.front}
      </div>
      <p className="mt-1 text-center text-xs text-majalis-ink/50">اضغط على البطاقة لقلبها</p>
      {flipped && (
        <div className="mt-2 flex gap-2">
          <button onClick={() => rate("HARD")} className="flex-1 rounded-lg bg-red-200 py-2 text-sm">صعبة</button>
          <button onClick={() => rate("MEDIUM")} className="flex-1 rounded-lg bg-amber-200 py-2 text-sm">متوسطة</button>
          <button onClick={() => rate("EASY")} className="flex-1 rounded-lg bg-green-200 py-2 text-sm">سهلة</button>
        </div>
      )}
    </div>
  );
}

function QuizView({ sessionId, questions, authed }: any) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  if (!questions?.length) return <p className="text-sm text-majalis-ink/60">لا يوجد اختبار لهذا المجلس بعد.</p>;

  const submit = async () => {
    if (!authed) return;
    const payload = { answers: Object.entries(answers).map(([quizQuestionId, userAnswer]) => ({ quizQuestionId, userAnswer })) };
    const res = await api(`/api/sessions/${sessionId}/quiz-attempts`, { method: "POST", body: JSON.stringify(payload) });
    setResult(res);
  };

  return (
    <div>
      {questions.map((q: any, qi: number) => {
        const r = result?.results?.find((x: any) => x.quizQuestionId === q.id);
        return (
          <div key={q.id} className="mb-4">
            <p className="mb-2 text-sm font-medium">{qi + 1}. {q.question}</p>
            <div className="flex flex-col gap-1.5">
              {q.options.map((op: string, oi: number) => {
                const chosen = answers[q.id] === oi;
                let cls = "border-majalis-gold/30";
                if (result) {
                  if (r?.correctAnswer === oi) cls = "bg-green-200 border-green-300";
                  else if (chosen) cls = "bg-red-200 border-red-300";
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
        <button onClick={submit} className="rounded-lg bg-majalis-green px-4 py-2 text-sm text-majalis-goldSoft">تسليم الإجابات</button>
      ) : (
        <p className="text-sm font-medium">نتيجتك: {result.score} / {result.total}</p>
      )}
    </div>
  );
}

function JournalView({ kind, sessionId, authed, placeholder }: any) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authed) return;
    api(`/api/sessions/${sessionId}/${kind}`).then((rows) => {
      if (rows[0]) setText(kind === "notes" ? rows[0].contentRichText : rows[0].content);
    }).catch(() => {});
  }, [sessionId, kind, authed]);

  const save = async () => {
    if (!authed) return;
    await api(`/api/sessions/${sessionId}/${kind}`, {
      method: "POST",
      body: JSON.stringify(kind === "notes" ? { contentRichText: text } : { content: text }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div>
      <textarea
        rows={7}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={authed ? placeholder : "سجّل الدخول لكتابة ملاحظاتك الخاصة"}
        disabled={!authed}
        className="w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2 text-sm"
      />
      <div className="mt-2 flex items-center gap-2">
        <button onClick={save} disabled={!authed} className="rounded-lg bg-majalis-green px-3 py-1.5 text-sm text-majalis-goldSoft disabled:opacity-40">
          حفظ
        </button>
        {saved && <span className="text-xs text-majalis-ink/60">تم الحفظ ✓</span>}
      </div>
      <p className="mt-1 text-xs text-majalis-ink/50">خاص بك ولا يظهر لأي مستخدم آخر.</p>
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

  const load = () => authed && api(`/api/sessions/${sessionId}/questions`).then(setList).catch(() => {});
  useEffect(() => { load(); }, [sessionId, authed]);

  const add = async () => {
    if (!text.trim() || !authed) return;
    await api(`/api/sessions/${sessionId}/questions`, { method: "POST", body: JSON.stringify({ content: text.trim(), category }) });
    setText("");
    load();
  };

  return (
    <div>
      <div className="mb-2 flex gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب سؤالك هنا..."
          className="flex-1 rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2 text-sm"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2 text-sm">
          {Object.entries(catLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={add} className="rounded-lg bg-majalis-gold px-3 text-sm">+</button>
      </div>
      {list.length === 0 && <p className="text-sm text-majalis-ink/60">لا توجد أسئلة مسجلة بعد.</p>}
      {list.map((q) => (
        <div key={q.id} className="mb-1.5 rounded-lg border border-majalis-gold/20 bg-majalis-beige p-2">
          <span className="text-xs text-majalis-gold">{catLabels[q.category]}</span>
          <p className="text-sm">{q.content}</p>
          {q.answer && <p className="mt-1 text-xs text-majalis-ink/60">إجابة المدرّس: {q.answer}</p>}
        </div>
      ))}
    </div>
  );
}

function LifeView({ sessionId, apps, authed, flashToast }: any) {
  const [committed, setCommitted] = useState<Record<string, boolean>>({});

  const commit = async (lifeApplicationId: string) => {
    if (!authed) return flashToast("سجّل الدخول لتتبع التزاماتك");
    await api(`/api/sessions/${sessionId}/life-commitments`, { method: "POST", body: JSON.stringify({ lifeApplicationId }) });
    setCommitted((c) => ({ ...c, [lifeApplicationId]: true }));
    flashToast("أُضيف إلى رحلتي من العلم إلى العمل");
  };

  if (!apps?.length) return <p className="text-sm text-majalis-ink/60">لا توجد تطبيقات حياتية لهذا المجلس بعد.</p>;

  return (
    <div className="flex flex-col gap-2">
      {apps.map((la: any) => (
        <div key={la.id} className="rounded-lg border border-majalis-gold/30 bg-majalis-beige p-3">
          <p className="text-sm font-medium">{la.title}</p>
          <p className="mb-2 text-sm text-majalis-ink/70">{la.description}</p>
          <button
            onClick={() => commit(la.id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${committed[la.id] ? "bg-green-200" : "bg-majalis-gold"}`}
          >
            {committed[la.id] ? "✓ سأطبق هذا" : "سأطبق هذا"}
          </button>
        </div>
      ))}
    </div>
  );
}
