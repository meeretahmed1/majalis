import { describe, it, expect } from "vitest";
import { assertOwnership } from "../src/lib/rbac";

describe("التحقق من ملكية السجلات الشخصية (assertOwnership)", () => {
  it("لا يرمي خطأ عندما يكون صاحب السجل هو المستخدم الحالي نفسه", () => {
    expect(() => assertOwnership("user_1", "user_1")).not.toThrow();
  });

  it("يرمي خطأ 403 عندما يحاول مستخدم الوصول إلى سجل مستخدم آخر", () => {
    try {
      assertOwnership("user_1", "user_2");
      throw new Error("كان يجب أن يرمي خطأ ولم يفعل");
    } catch (err: any) {
      expect(err.status).toBe(403);
    }
  });

  it("لا يسمح بتخمين نفس المعرّف عبر قيم فارغة أو متشابهة جزئياً", () => {
    expect(() => assertOwnership("user_10", "user_1")).toThrow();
  });
});
