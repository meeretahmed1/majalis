import { describe, it, expect } from "vitest";
import { nextReview } from "../src/lib/srs";

describe("نظام التكرار المتباعد (Spaced Repetition)", () => {
  it("يعيد بطاقة صعبة للمراجعة غداً دائماً", () => {
    const { nextReviewAt } = nextReview(null, "HARD", new Date("2026-01-01T00:00:00Z"));
    const diffDays = (nextReviewAt.getTime() - new Date("2026-01-01T00:00:00Z").getTime()) / 86400000;
    expect(diffDays).toBe(1);
  });

  it("يزيد الفاصل الزمني تدريجياً مع تقييم 'سهلة' المتكرر", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const r1 = nextReview(null, "EASY", now);
    const r2 = nextReview(r1.state, "EASY", now);
    const r3 = nextReview(r2.state, "EASY", now);

    expect(r2.state.intervalDays).toBeGreaterThan(r1.state.intervalDays);
    expect(r3.state.intervalDays).toBeGreaterThan(r2.state.intervalDays);
  });

  it("لا يسمح لعامل السهولة بالنزول تحت الحد الأدنى مهما تكررت الإجابات الصعبة", () => {
    let state = null as any;
    for (let i = 0; i < 10; i++) {
      const r = nextReview(state, "HARD");
      state = r.state;
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("المراجعة القادمة تكون دائماً في المستقبل بالنسبة لوقت التقييم", () => {
    const now = new Date("2026-03-15T00:00:00Z");
    const { nextReviewAt } = nextReview(null, "MEDIUM", now);
    expect(nextReviewAt.getTime()).toBeGreaterThan(now.getTime());
  });
});
