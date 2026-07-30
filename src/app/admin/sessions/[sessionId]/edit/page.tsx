"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

async function api(url: string, options?: RequestInit) {
  const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "حدث خطأ");
  return res.json();
}

export default function AdminSessionEditPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [toast, setToast] = useState("");

  const flashToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1800); };

  const load = useCallback(async () => {
    const s = await api(`/api/sessions/${params.sessionId}`);
    setSession(s);
    const books = await api(`/api/admin/books`);
    setAllSessions(books.flatMap((b: any) => b.sections.flatMap((sec: any) => sec.sessions)).filter((x: any) => x.id !== params.sessionId));
  }, [params.sessionId]);

  useEffect(() => { load(); }, [load]);

  if (!session) return <p className="text-sm text-majalis-ink/60">جارٍ التحميل...</p>;

  const patchSession = async (patch: any) => {
    await api(`/api/admin/sessions/${session.id}`, { method: "PATCH", body: JSON.stringify(patch) });
    flashToast("تم الحفظ");
  };

  const Field = ({ label, value, onBlur, area }: any) => (
    <div className="mb-3">
      <label className="mb-1 block text-xs text-majalis-ink/60">{label}</label>
      {area ? (
        <textarea defaultValue={value} onBlur={(e) => onBlur(e.target.value)} rows={3} className="w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2 text-sm" />
      ) : (
        <input defaultValue={value} onBlur={(e) => onBlur(e.target.value)} className="w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2 text-sm" />
      )}
    </div>
  );

  const ListEditor = ({ label, items, onChange }: any) => {
    const [v, setV] = useState("");
    return (
      <div className="mb-3">
        <label className="mb-1 block text-xs text-majalis-ink/60">{label}</label>
        {items.map((it: string, i: number) => (
          <div key={i} className="mb-1 flex gap-1.5">
            <div className="flex-1 rounded-lg border border-majalis-gold/30 bg-majalis-beige px-2 py-1.5 text-sm">{it}</div>
            <button onClick={() => onChange(items.filter((_: any, idx: number) => idx !== i))} className="text-red-600">×</button>
          </div>
        ))}
        <div className="flex gap-1.5">
          <input value={v} onChange={(e) => setV(e.target.value)} className="flex-1 rounded-lg border border-majalis-gold/30 bg-majalis-beige p-1.5 text-sm" />
          <button onClick={() => { if (v.trim()) { onChange([...items, v.trim()]); setV(""); } }} className="rounded-lg bg-majalis-gold px-2 text-sm">+</button>
        </div>
      </div>
    );
  };

  const updateSummaryField = (key: string, val: string[]) => {
    const next = { ...session.summary, [key]: val };
    setSession({ ...session, summary: next });
    patchSession({ summary: { keyIdeas: next.keyIdeas, terms: next.terms, evidences: next.evidences, benefits: next.benefits, reviewPoints: next.reviewPoints } });
  };

  const addFlashcard = async () => {
    const card = await api(`/api/admin/sessions/${session.id}/flashcards`, { method: "POST", body: JSON.stringify({ front: "سؤال جديد", back: "الإجابة" }) });
    setSession({ ...session, flashcards: [...session.flashcards, card] });
  };
  const updateFlashcard = async (id: string, patch: any) => {
    await api(`/api/admin/sessions/${session.id}/flashcards/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    setSession({ ...session, flashcards: session.flashcards.map((c: any) => (c.id === id ? { ...c, ...patch } : c)) });
  };
  const removeFlashcard = async (id: string) => {
    await api(`/api/admin/sessions/${session.id}/flashcards/${id}`, { method: "DELETE" });
    setSession({ ...session, flashcards: session.flashcards.filter((c: any) => c.id !== id) });
  };

  const addQuiz = async () => {
    const q = await api(`/api/admin/sessions/${session.id}/quiz-questions`, {
      method: "POST",
      body: JSON.stringify({ type: "MCQ", question: "سؤال جديد", options: ["أ", "ب", "ج", "د"], correctAnswer: 0, explanation: "" }),
    });
    setSession({ ...session, quizQuestions: [...session.quizQuestions, q] });
  };
  const updateQuiz = async (id: string, patch: any) => {
    await api(`/api/admin/sessions/${session.id}/quiz-questions/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    setSession({ ...session, quizQuestions: session.quizQuestions.map((q: any) => (q.id === id ? { ...q, ...patch } : q)) });
  };
  const removeQuiz = async (id: string) => {
    await api(`/api/admin/sessions/${session.id}/quiz-questions/${id}`, { method: "DELETE" });
    setSession({ ...session, quizQuestions: session.quizQuestions.filter((q: any) => q.id !== id) });
  };

  const addLifeApp = async () => {
    const l = await api(`/api/admin/sessions/${session.id}/life-applications`, { method: "POST", body: JSON.stringify({ title: "تطبيق جديد", description: "" }) });
    setSession({ ...session, lifeApplications: [...session.lifeApplications, l] });
  };
  const updateLifeApp = async (id: string, patch: any) => {
    await api(`/api/admin/sessions/${session.id}/life-applications/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    setSession({ ...session, lifeApplications: session.lifeApplications.map((l: any) => (l.id === id ? { ...l, ...patch } : l)) });
  };
  const removeLifeApp = async (id: string) => {
    await api(`/api/admin/sessions/${session.id}/life-applications/${id}`, { method: "DELETE" });
    setSession({ ...session, lifeApplications: session.lifeApplications.filter((l: any) => l.id !== id) });
  };

  const addLink = async () => {
    if (allSessions.length === 0) return;
    const link = await api(`/api/admin/sessions/${session.id}/links`, {
      method: "POST",
      body: JSON.stringify({ linkedSessionId: allSessions[0].id, linkType: "COMPLEMENTARY", label: "" }),
    });
    setSession({ ...session, linksFrom: [...session.linksFrom, { ...link, linkedSession: allSessions[0] }] });
  };
  const removeLink = async (id: string) => {
    await api(`/api/admin/sessions/${session.id}/links/${id}`, { method: "DELETE" });
    setSession({ ...session, linksFrom: session.linksFrom.filter((l: any) => l.id !== id) });
  };

  return (
    <div className="mx-auto max-w-xl">
      <button onClick={() => router.push("/admin")} className="mb-3 text-sm text-majalis-ink/60">→ رجوع للوحة الإدارة</button>
      <h1 className="font-display mb-4 text-xl">تحرير: {session.title}</h1>
      {toast && <div className="mb-3 rounded-lg bg-majalis-gold px-3 py-2 text-sm">{toast}</div>}

      <div className="mb-4 rounded-xl border border-majalis-gold/30 bg-majalis-card p-4">
        <Field label="عنوان المجلس" value={session.title} onBlur={(v: string) => { setSession({ ...session, title: v }); patchSession({ title: v }); }} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="التاريخ" value={session.date} onBlur={(v: string) => patchSession({ date: v })} />
          <Field label="المدة" value={session.duration} onBlur={(v: string) => patchSession({ duration: v })} />
        </div>
        <Field label="رابط الفيديو" value={session.videoUrl} onBlur={(v: string) => patchSession({ videoUrl: v })} />
        <Field label="النص الكامل" value={session.textContent} onBlur={(v: string) => patchSession({ textContent: v })} area />
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-majalis-ink/60">الحالة: {session.status === "PUBLISHED" ? "منشور" : "مسودة"}</span>
          {session.status !== "PUBLISHED" ? (
            <button onClick={() => { setSession({ ...session, status: "PUBLISHED" }); patchSession({ status: "PUBLISHED" }); }} className="rounded-lg bg-majalis-green px-3 py-1 text-xs text-majalis-goldSoft">
              نشر المجلس
            </button>
          ) : (
            <button onClick={() => { setSession({ ...session, status: "DRAFT" }); patchSession({ status: "DRAFT" }); }} className="rounded-lg border border-majalis-gold/40 px-3 py-1 text-xs">
              إعادة إلى مسودة
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-majalis-gold/30 bg-majalis-card p-4">
        <p className="mb-2 font-medium">الملخص</p>
        <ListEditor label="أهم الأفكار" items={session.summary?.keyIdeas ?? []} onChange={(v: string[]) => updateSummaryField("keyIdeas", v)} />
        <ListEditor label="التعريفات والمصطلحات" items={session.summary?.terms ?? []} onChange={(v: string[]) => updateSummaryField("terms", v)} />
        <ListEditor label="الأدلة" items={session.summary?.evidences ?? []} onChange={(v: string[]) => updateSummaryField("evidences", v)} />
        <ListEditor label="الفوائد" items={session.summary?.benefits ?? []} onChange={(v: string[]) => updateSummaryField("benefits", v)} />
        <ListEditor label="نقاط تحتاج مراجعة" items={session.summary?.reviewPoints ?? []} onChange={(v: string[]) => updateSummaryField("reviewPoints", v)} />
      </div>

      <div className="mb-4 rounded-xl border border-majalis-gold/30 bg-majalis-card p-4">
        <p className="mb-2 font-medium">الخريطة الذهنية (مخطط بمسافات بادئة)</p>
        <textarea
          defaultValue={session.mindMap?.nodesJson?.outline ?? ""}
          onBlur={(e) => patchSession({ mindMap: { outline: e.target.value } })}
          rows={6}
          className="w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-2 font-mono text-xs"
        />
      </div>

      <div className="mb-4 rounded-xl border border-majalis-gold/30 bg-majalis-card p-4">
        <div className="mb-2 flex justify-between"><p className="font-medium">البطاقات التعليمية</p><button onClick={addFlashcard} className="rounded-lg bg-majalis-gold px-2 text-sm">+</button></div>
        {session.flashcards.map((c: any) => (
          <div key={c.id} className="mb-2 flex gap-1.5">
            <input defaultValue={c.front} onBlur={(e) => updateFlashcard(c.id, { front: e.target.value })} placeholder="السؤال" className="flex-1 rounded-lg border border-majalis-gold/30 bg-majalis-beige p-1.5 text-sm" />
            <input defaultValue={c.back} onBlur={(e) => updateFlashcard(c.id, { back: e.target.value })} placeholder="الإجابة" className="flex-1 rounded-lg border border-majalis-gold/30 bg-majalis-beige p-1.5 text-sm" />
            <button onClick={() => removeFlashcard(c.id)} className="text-red-600">×</button>
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-majalis-gold/30 bg-majalis-card p-4">
        <div className="mb-2 flex justify-between"><p className="font-medium">الاختبار القصير</p><button onClick={addQuiz} className="rounded-lg bg-majalis-gold px-2 text-sm">+</button></div>
        {session.quizQuestions.map((q: any) => (
          <div key={q.id} className="mb-3 rounded-lg border border-majalis-gold/20 p-2">
            <div className="mb-1 flex gap-1.5">
              <input defaultValue={q.question} onBlur={(e) => updateQuiz(q.id, { question: e.target.value })} className="flex-1 rounded-lg border border-majalis-gold/30 bg-majalis-beige p-1.5 text-sm" />
              <button onClick={() => removeQuiz(q.id)} className="text-red-600">×</button>
            </div>
            {q.options.map((op: string, oi: number) => (
              <div key={oi} className="mb-1 flex items-center gap-1.5">
                <input type="radio" checked={q.correctAnswer === oi} onChange={() => updateQuiz(q.id, { correctAnswer: oi })} />
                <input
                  defaultValue={op}
                  onBlur={(e) => updateQuiz(q.id, { options: q.options.map((o: string, idx: number) => (idx === oi ? e.target.value : o)) })}
                  className="flex-1 rounded-lg border border-majalis-gold/30 bg-majalis-beige p-1.5 text-sm"
                />
              </div>
            ))}
            <input defaultValue={q.explanation} onBlur={(e) => updateQuiz(q.id, { explanation: e.target.value })} placeholder="تفسير الإجابة" className="mt-1 w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-1.5 text-sm" />
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-majalis-gold/30 bg-majalis-card p-4">
        <div className="mb-2 flex justify-between"><p className="font-medium">من العلم إلى الحياة</p><button onClick={addLifeApp} className="rounded-lg bg-majalis-gold px-2 text-sm">+</button></div>
        {session.lifeApplications.map((l: any) => (
          <div key={l.id} className="mb-2">
            <div className="flex gap-1.5">
              <input defaultValue={l.title} onBlur={(e) => updateLifeApp(l.id, { title: e.target.value })} className="flex-1 rounded-lg border border-majalis-gold/30 bg-majalis-beige p-1.5 text-sm" />
              <button onClick={() => removeLifeApp(l.id)} className="text-red-600">×</button>
            </div>
            <textarea defaultValue={l.description} onBlur={(e) => updateLifeApp(l.id, { description: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige p-1.5 text-sm" />
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-majalis-gold/30 bg-majalis-card p-4">
        <div className="mb-2 flex justify-between"><p className="font-medium">روابط بمجالس أخرى</p><button onClick={addLink} className="rounded-lg bg-majalis-gold px-2 text-sm">+</button></div>
        {session.linksFrom.map((l: any) => (
          <div key={l.id} className="mb-1.5 flex items-center gap-1.5 text-sm">
            <span className="rounded bg-majalis-beige px-2 py-1 text-xs">{l.linkType}</span>
            <span className="flex-1">{l.linkedSession.title}</span>
            <button onClick={() => removeLink(l.id)} className="text-red-600">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
