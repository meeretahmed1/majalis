import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

const inputSchema = z.object({
  videoUrl: z.string().min(1).max(500),
  transcript: z.string().max(90000).optional(),
  model: z.string().optional(),
});

const schema = z.object({
  title: z.string().default("مجلس بدون عنوان"),
  keyIdeas: z.array(z.string()).default([]),
  terms: z.array(z.string()).default([]),
  evidences: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  reviewPoints: z.array(z.string()).default([]),
  outline: z.string().default(""),
  flashcards: z.array(z.object({ front: z.string(), back: z.string() })).default([]),
  quizQuestions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.number().int().min(0).max(3).default(0),
      explanation: z.string().default(""),
    })
  ).default([]),
  lifeApplications: z.array(
    z.object({ title: z.string(), description: z.string() })
  ).default([]),
});

function extractVideoId(raw: string): string | null {
  try {
    const trimmed = raw.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

    const match = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=)|(?:^|[?&])v=)([a-zA-Z0-9_-]{11})/i
    );
    if (match && match[1]) return match[1];

    const vParam = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (vParam) return vParam[1];

    const urlStr = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const u = new URL(urlStr);
    if (u.hostname.includes("youtu.be")) {
      const seg = u.pathname.slice(1).split("/")[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(seg)) return seg;
    }
    if (u.hostname.includes("youtube") || u.hostname.includes("youtu")) {
      if (u.pathname.startsWith("/shorts/")) {
        const seg = u.pathname.split("/")[2];
        if (/^[a-zA-Z0-9_-]{11}$/.test(seg)) return seg;
      }
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

async function captions(id: string): Promise<string> {
  try {
    const r = await fetch(
      `https://www.youtube.com/api/timedtext?v=${encodeURIComponent(id)}&lang=ar&fmt=json3`,
      { signal: AbortSignal.timeout(9000) }
    );
    if (!r.ok) return "";
    const raw = await r.text();
    if (!raw.trim().startsWith("{")) return "";
    const json = JSON.parse(raw);
    return (json.events ?? [])
      .flatMap((e: any) => e.segs ?? [])
      .map((s: any) => s.utf8 ?? "")
      .join(" ")
      .trim();
  } catch {
    return "";
  }
}

export async function POST(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    await requireRole(["ADMIN", "TEACHER"]);
    const session = await prisma.session.findUnique({
      where: { id: params.sessionId },
      select: { id: true },
    });
    if (!session) {
      return NextResponse.json({ error: "المجلس غير موجود" }, { status: 404 });
    }

    const { videoUrl, transcript, model: customModel } = inputSchema.parse(
      await req.json()
    );

    const id = extractVideoId(videoUrl);
    if (!id) {
      return NextResponse.json(
        { error: "تعذر استخراج معرّف فيديو YouTube. يرجى التأكد من صحة الرابط." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "أضيفي GEMINI_API_KEY إلى إعدادات السيرفر أولاً" },
        { status: 503 }
      );
    }

    const source = transcript?.trim() || (await captions(id).catch(() => ""));
    if (source.length < 50) {
      return NextResponse.json(
        {
          error:
            "تعذر الحصول على تفريغ تلقائي من YouTube. يرجى فتح الفيديو ونسخ نص التفريغ (Transcript) ولصقه في الحقل المخصص أدناه ثم إعادة المحاولة.",
        },
        { status: 422 }
      );
    }

    const processedText = source.slice(0, 35000);

    const prompt = `حلل النص العربي التالي لمجلس علمي إسلامي، وأعد كائن JSON فقط باللغة العربية الفصحى وفق هذا المخطط الدقيق بدون نصوص توضيحية إضافية:
{
  "title": "عنوان موجز ودقيق للمجلس مستنبط من موضوع الشرح",
  "keyIdeas": ["5 إلى 8 أفكار رئيسية وتأصيلية وردت في الدرس"],
  "terms": ["المصطلحات الفقهية أو العلمية والتعريفات المذكورة في النص"],
  "evidences": ["الآيات القرآنية والأحاديث النبوية المذكورة صراحة في النص فقط؛ إذا لم يرد دليل اجعل المصفوفة فارغة"],
  "benefits": ["فوائد ولطائف وحكم مستفادة من المجلس"],
  "reviewPoints": ["نقاط منهجية تحتاج إلى مراجعة وتأمل وتكرار"],
  "outline": "خريطة ذهنية نصية منظمة بمسافات بادئة (Indented outline)",
  "flashcards": [
    {"front": "سؤال محدد عن مسألة أو تعريف في الدرس", "back": "الإجابة الموجزة الشافية"}
  ],
  "quizQuestions": [
    {
      "question": "نص سؤال الاختبار",
      "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
      "correctAnswer": 0,
      "explanation": "شرح سبب صحة الإجابة اعتماداً على الدرس"
    }
  ],
  "lifeApplications": [
    {"title": "عنوان التطبيق العملي", "description": "خطوة عملية وتطبيقية في السلوك والعبادة والحياة اليومية"}
  ]
}

قواعد مهمة:
- اكتب 5-8 أفكار، و3-6 بطاقات، و3-5 أسئلة اختيار من متعدد (كل سؤال معه 4 خيارات ورقم الإجابة 0-3)، و2-4 تطبيقات حياتية.
- لا تختلق أي آية أو حديث أو مصدر لم يرد في النص الأصلي مطلقاً.
- اكتب بصيغة JSON نقية ومباشرة.

النص المفرغ للمجلس:
${processedText}`;

    const candidateModels = [
      customModel,
      process.env.GEMINI_MODEL,
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ].filter(Boolean) as string[];

    const modelsToTry = [...new Set(candidateModels)];

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let generatedData: any = null;
    let successfulModel = "";
    let lastErrorDetails = "";

    for (const currentModel of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        let responseText = response.text || "";
        responseText = responseText.trim();

        if (responseText.startsWith("```json")) {
          responseText = responseText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        } else if (responseText.startsWith("```")) {
          responseText = responseText.replace(/^```\s*/i, "").replace(/```$/i, "").trim();
        }

        const parsedJson = JSON.parse(responseText);

        if (Array.isArray(parsedJson.quizQuestions)) {
          parsedJson.quizQuestions = parsedJson.quizQuestions.map((q: any) => {
            let opts = Array.isArray(q.options) ? q.options : [];
            while (opts.length < 4) opts.push(`خيار ${opts.length + 1}`);
            if (opts.length > 4) opts = opts.slice(0, 4);
            return {
              ...q,
              options: opts,
              correctAnswer: typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer < 4 ? q.correctAnswer : 0,
            };
          });
        }

        generatedData = schema.parse(parsedJson);
        successfulModel = currentModel;
        break;
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        lastErrorDetails = errMsg;

        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("500") ||
          errMsg.includes("502") ||
          errMsg.includes("504") ||
          errMsg.includes("overloaded");

        if (isTransient) {
          console.warn(`[Gemini Fallback] Model ${currentModel} returned transient error: ${errMsg}. Trying next candidate model...`);
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        } else {
          console.warn(`[Gemini Fallback] Model ${currentModel} failed: ${errMsg}`);
          continue;
        }
      }
    }

    if (!generatedData) {
      const is503 = lastErrorDetails.includes("503") || lastErrorDetails.includes("high demand");
      const userMessage = is503
        ? "خوادم Gemini تواجه حالياً ضغطاً مؤقتاً عالياً (503 High Demand). تمت المحاولة تلقائياً عبر عدة نماذج بديلة. يُرجى الانتظار 30 ثانية والضغط على «توليد ومعاينة المحتوى» مرة أخرى."
        : `تعذر إكمال التوليد حالياً: ${lastErrorDetails}. يُرجى التحقق من المفتاح أو تقليل حجم النص المفرغ قليلاً.`;

      return NextResponse.json({ error: userMessage }, { status: 503 });
    }

    return NextResponse.json({
      generated: generatedData,
      transcript: source,
      videoUrl,
      modelUsed: successfulModel,
    });
  } catch (e: any) {
    const isTimeout =
      e?.name === "TimeoutError" ||
      e?.message?.toLowerCase().includes("timeout") ||
      e?.message?.toLowerCase().includes("aborted");

    const errorMessage = isTimeout
      ? "استغرق توليد المحتوى وقتاً أطول من المتوقع (Timeout). يرجى تقليل نص المحاضرة قليلاً أو إعادة المحاولة."
      : e?.message || "تعذر توليد المحتوى";

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
