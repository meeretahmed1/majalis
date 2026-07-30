/**
 * خوارزمية تكرار متباعد مبسّطة (مستوحاة من SM-2).
 * كل بطاقة تحمل "سهولة" (easeFactor) تزيد أو تنقص حسب تقييم المستخدم،
 * والفاصل الزمني للمراجعة القادمة يُحسب بضرب الفاصل السابق بعامل السهولة.
 */

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface ReviewState {
  intervalDays: number;
  easeFactor: number;
}

const DEFAULT_STATE: ReviewState = { intervalDays: 1, easeFactor: 2.3 };

const EASE_DELTA: Record<Difficulty, number> = {
  EASY: 0.15,
  MEDIUM: 0,
  HARD: -0.3,
};

const MIN_EASE = 1.3;

export function nextReview(previous: ReviewState | null, difficulty: Difficulty, now: Date = new Date()): {
  state: ReviewState;
  nextReviewAt: Date;
} {
  const prev = previous ?? DEFAULT_STATE;

  const easeFactor = Math.max(MIN_EASE, prev.easeFactor + EASE_DELTA[difficulty]);

  let intervalDays: number;
  if (difficulty === "HARD") {
    intervalDays = 1;
  } else {
    intervalDays = Math.max(1, Math.round(prev.intervalDays * easeFactor));
  }

  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return { state: { intervalDays, easeFactor }, nextReviewAt };
}
