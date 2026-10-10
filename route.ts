import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;
const inputSchema = z.object({ videoUrl: z.string().url().max(500), transcript: z.string().max(90000).optional() });
const schema = z.object({
  title: z.string(), keyIdeas: z.array(z.string()), terms: z.array(z.string()),
  evidences: z.array(z.string()), benefits: z.array(z.string()), reviewPoints: z.array(z.string()),
  outline: z.string(), flashcards: z.array(z.object({ front: z.string(), back: z.string() })),
  quizQuestions: z.array(z.object({ question: z.string(), options: z.array(z.string()).length(4), correctAnswer: z.number().int().min(0).max(3), explanation: z.string() })),
  lifeApplications: z.array(z.object({ title: z.string(), description: z.string() })),
});
function videoId(raw: string) {
  const u = new URL(raw);
  if (u.hostname === "youtu.be") return u.pathname.slice(1);
  if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(u.hostname))
    return u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : u.searchParams.get("v");
  return null;
}
// YouTube doesn't provide unrestricted public transcript downloads. This best-effort
// endpoint is deliberately optional; paste captions manually when unavailable.
async function captions(id: string): Promise<string> {
  const r = await fetch(`https://www.youtube.com/api/timedtext?v=${encodeURIComponent(id)}&lang=ar&fmt=json3`, { signal: AbortSignal.timeout(9000) });
  if (!r.ok) return "";
  const raw = await r.text();
  if (!raw.trim().startsWith("{")) return "";
  const json = JSON.parse(raw);
  return (json.events ?? []).flatMap((e: any) => e.segs ?? []).map((s: any) => s.utf8 ?? "").join(" ").trim();
}
export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    const session = await prisma.session.findUnique({ where: { id: params.sessionId }, select: { id: true } });
    if (!session) return NextResponse.json({ error: "المجلس غير موجود" }, { status: 404 });
    const { videoUrl, transcript } = inputSchema.parse(await req.json());
    const id = videoId(videoUrl);
    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return NextResponse.json({ error: "رابط YouTube غير صحيح" }, { status: 400 });
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "أضيفي GEMINI_API_KEY إلى إعدادات السيرفر أولاً" }, { status: 503 });
    const source = transcript?.trim() || await captions(id).catch(() => "");
    if (source.length < 100) return NextResponse.json({ error: "تعذر الحصول على Transcript تلقائياً. انسخي نص الترجمة في الحقل المخصص ثم أعيدي المحاولة." }, { status: 422 });
    const prompt = `حلل النص العربي التالي لمجلس علمي، وأعد JSON فقط بهذه المفاتيح: title, keyIdeas (string[]), terms (string[]), evidences (string[]), benefits (string[]), reviewPoints (string[]), outline (string), flashcards ({front,back}[]), quizQuestions ({question,options (exactly 4 strings),correctAnswer (zero-based integer),explanation}[]), lifeApplications ({title,description}[]). اكتب 5-8 أفكار و5 بطاقات و5 أسئلة و3 تطبيقات. لا تختلق آيات أو أحاديث أو مصادر؛ الأدلة فقط مما ورد صراحة في النص، وإذا لم يوجد دليل اجعل القائمة فارغة. استعمل العربية الفصحى الواضحة، ولا تضف معلومات خارج النص. النص:\n${source.slice(0, 75000)}`;
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      return NextResponse.json({ error: `فشل Gemini (${response.status}): ${detail.error?.message || "راجعي المفتاح أو حدود الاستخدام أو اسم النموذج"}` }, { status: 502 });
    }
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("");
    if (!text) throw new Error("لم يرجع النموذج محتوى");
    const generated = schema.parse(JSON.parse(text));
    return NextResponse.json({ generated, transcript: source, videoUrl }); // preview ONLY, no database writes
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "تعذر توليد المحتوى" }, { status: e?.status || 400 });
  }
}
