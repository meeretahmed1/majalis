import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type SessionUser = { id: string; name: string; email: string; role: "ADMIN" | "TEACHER" | "STUDENT" };

/**
 * يُرجع المستخدم الحالي من الجلسة، أو null إن لم يكن مسجلاً للدخول.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as unknown as SessionUser;
}

/**
 * يتحقق أن المستخدم الحالي يملك أحد الأدوار المسموحة، وإلا يرمي خطأ 401/403.
 * الاستخدام: const user = await requireRole(["ADMIN"]);
 */
export async function requireRole(allowed: Array<SessionUser["role"]>): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("غير مسجل للدخول");
    (err as any).status = 401;
    throw err;
  }
  if (!allowed.includes(user.role)) {
    const err = new Error("لا تملك صلاحية للقيام بهذا الإجراء");
    (err as any).status = 403;
    throw err;
  }
  return user;
}

/**
 * يتحقق أن السجل الشخصي (ملاحظة/خاطرة/سؤال...) يعود فعلاً لصاحب الجلسة.
 * يمنع أي مستخدم من قراءة أو تعديل بيانات مستخدم آخر حتى لو خمّن الـ id الصحيح.
 */
export function assertOwnership(recordUserId: string, currentUserId: string) {
  if (recordUserId !== currentUserId) {
    const err = new Error("لا يمكنك الوصول إلى بيانات مستخدم آخر");
    (err as any).status = 403;
    throw err;
  }
}
