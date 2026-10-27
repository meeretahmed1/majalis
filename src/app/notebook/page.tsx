"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  BookMarked,
  Sparkles,
  CheckCircle2,
  Circle,
  Share2,
  Trash2,
  Plus,
  BookOpen,
  Filter,
  Check,
  Download,
  Calendar,
} from "lucide-react";

interface NotebookItem {
  id: string;
  type: "note" | "reflection" | "commitment";
  title: string;
  content: string;
  bookTitle?: string;
  sessionTitle?: string;
  sessionSlug?: string;
  bookSlug?: string;
  createdAt: string;
  completed?: boolean;
}

const DEFAULT_ITEMS: NotebookItem[] = [
  {
    id: "sample-1",
    type: "reflection",
    title: "تأمل في حكمة الاعتماد على العمل",
    content: "«من علامات الاعتماد على العمل، نقصان الرجاء عند وجود الزلل» — الفرق الدقيق بين بذل السبب مع تفويض النتيجة لله، وبين الركون إلى العمل نفسه والغرور به.",
    bookTitle: "الحكم العطائية",
    sessionTitle: "المجلس ١: علامات الاعتماد على العمل والتجريد والأسباب",
    sessionSlug: "session-1",
    bookSlug: "fadl-al-ilm",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-2",
    type: "commitment",
    title: "تجديد النية قبل كل مجلس علم",
    content: "استحضار نية رفع الجهل عن النفس وعن الناس والعمل بما يُعلم، وتفريغ القلب من طلب الجاه أو المباهاة.",
    bookTitle: "إحياء علوم الدين - كتاب العلم",
    sessionTitle: "المجلس ١: فرضية العلم وآداب المتعلم والعالم",
    sessionSlug: "session-551d087b20fe",
    bookSlug: "book-8c380bf3d820",
    createdAt: new Date().toISOString(),
    completed: true,
  },
  {
    id: "sample-3",
    type: "note",
    title: "ضابط الماء الطهور والفرق بينه وبين الطاهر",
    content: "الماء المطلق هو الباقي على خلقته وأصل صفته، ويجوز به الوضوء ورفع الحدث وإزالة النجس، أما الماء المستعمل فلا يرفع الحدث في المعتمد من المذهب.",
    bookTitle: "فتح القريب المجيب",
    sessionTitle: "المجلس ١: كتاب الطهارة وأنواع المياه",
    sessionSlug: "session-9b769212c40c",
    bookSlug: "fath-al-qareeb",
    createdAt: new Date().toISOString(),
  },
];

export default function NotebookPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<NotebookItem[]>([]);
  const [filterType, setFilterType] = useState<"all" | "note" | "reflection" | "commitment">("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<"note" | "reflection" | "commitment">("note");
  const [newBook, setNewBook] = useState("الحكم العطائية");
  const [copied, setCopied] = useState(false);

  // Load from local storage or server
  useEffect(() => {
    const saved = localStorage.getItem("majalis_student_notebook");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          return;
        }
      } catch {
        // ignore parse error
      }
    }

    // Default sample set
    setItems(DEFAULT_ITEMS);
    localStorage.setItem("majalis_student_notebook", JSON.stringify(DEFAULT_ITEMS));
  }, []);

  const saveItems = (updated: NotebookItem[]) => {
    setItems(updated);
    localStorage.setItem("majalis_student_notebook", JSON.stringify(updated));
  };

  const toggleCommitment = (id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    saveItems(updated);
  };

  const deleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    saveItems(updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newItem: NotebookItem = {
      id: `user-note-${Date.now()}`,
      type: newType,
      title: newTitle.trim(),
      content: newContent.trim(),
      bookTitle: newBook,
      createdAt: new Date().toISOString(),
      completed: false,
    };

    const updated = [newItem, ...items];
    saveItems(updated);
    setNewTitle("");
    setNewContent("");
    setShowAddModal(false);
  };

  const exportAll = () => {
    const text = items
      .map(
        (it) =>
          `### [${getTypeLabel(it.type)}] ${it.title}\n* المصدر: ${it.bookTitle || "عام"}\n* التاريخ: ${new Date(it.createdAt).toLocaleDateString("ar-EG")}\n\n${it.content}\n\n---\n`
      )
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getTypeLabel = (type: NotebookItem["type"]) => {
    switch (type) {
      case "note":
        return "فائدة علمية";
      case "reflection":
        return "خاطرة وتزكية";
      case "commitment":
        return "تطبيق عملي";
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (searchFilter) {
      const match =
        item.title.includes(searchFilter) ||
        item.content.includes(searchFilter) ||
        (item.bookTitle && item.bookTitle.includes(searchFilter));
      if (!match) return false;
    }
    return true;
  });

  const notesCount = items.filter((i) => i.type === "note").length;
  const reflectionsCount = items.filter((i) => i.type === "reflection").length;
  const commitmentsCount = items.filter((i) => i.type === "commitment").length;
  const completedCommitments = items.filter((i) => i.type === "commitment" && i.completed).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-majalis-gold/40 bg-gradient-to-br from-majalis-card to-majalis-beige/40 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-majalis-gold">
              <BookMarked className="h-5 w-5" />
              <span className="text-xs font-medium tracking-wide">كُنّاش الفوائد التراثية</span>
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold text-majalis-ink">
              دفتر الفوائد والتطبيقات
            </h1>
            <p className="mt-1 text-sm text-majalis-ink/70">
              مستودعك العلمي الجامع لخواطرك وملاحظاتك وتطبيقاتك الحية المستخلصة من مجالس العلم.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-majalis-green px-3.5 py-2 text-xs font-medium text-majalis-goldSoft shadow hover:bg-majalis-green/90 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة فائدة</span>
            </button>
            <button
              onClick={exportAll}
              className="flex items-center gap-1.5 rounded-xl border border-majalis-gold/40 bg-majalis-card px-3 py-2 text-xs font-medium text-majalis-ink hover:border-majalis-gold transition-all"
              title="نسخ جميع الفوائد إلى الحافظة بصيغة نصية"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Download className="h-4 w-4" />}
              <span>{copied ? "تم النسخ!" : "تصدير الفوائد"}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-majalis-gold/20 bg-majalis-card/80 p-3">
            <div className="text-[11px] text-majalis-ink/60">الفوائد والملاحظات</div>
            <div className="mt-1 font-display text-xl font-bold text-majalis-green dark:text-emerald-400">
              {notesCount}
            </div>
          </div>
          <div className="rounded-xl border border-majalis-gold/20 bg-majalis-card/80 p-3">
            <div className="text-[11px] text-majalis-ink/60">الخواطر القلبية</div>
            <div className="mt-1 font-display text-xl font-bold text-majalis-gold">
              {reflectionsCount}
            </div>
          </div>
          <div className="rounded-xl border border-majalis-gold/20 bg-majalis-card/80 p-3">
            <div className="text-[11px] text-majalis-ink/60">التطبيقات الحياتية</div>
            <div className="mt-1 font-display text-xl font-bold text-purple-700 dark:text-purple-400">
              {commitmentsCount}
            </div>
          </div>
          <div className="rounded-xl border border-majalis-gold/20 bg-majalis-card/80 p-3">
            <div className="text-[11px] text-majalis-ink/60">تم إنجازه وتطبيقه</div>
            <div className="mt-1 font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {completedCommitments} / {commitmentsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Type Filter Buttons */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterType("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterType === "all"
                ? "bg-majalis-gold text-majalis-ink shadow-sm"
                : "border border-majalis-gold/30 bg-majalis-card hover:bg-majalis-beige/50"
            }`}
          >
            الكل ({items.length})
          </button>
          <button
            onClick={() => setFilterType("note")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterType === "note"
                ? "bg-majalis-gold text-majalis-ink shadow-sm"
                : "border border-majalis-gold/30 bg-majalis-card hover:bg-majalis-beige/50"
            }`}
          >
            فوائد علمية ({notesCount})
          </button>
          <button
            onClick={() => setFilterType("reflection")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterType === "reflection"
                ? "bg-majalis-gold text-majalis-ink shadow-sm"
                : "border border-majalis-gold/30 bg-majalis-card hover:bg-majalis-beige/50"
            }`}
          >
            خواطر وتزكية ({reflectionsCount})
          </button>
          <button
            onClick={() => setFilterType("commitment")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterType === "commitment"
                ? "bg-majalis-gold text-majalis-ink shadow-sm"
                : "border border-majalis-gold/30 bg-majalis-card hover:bg-majalis-beige/50"
            }`}
          >
            تطبيقات عملية ({commitmentsCount})
          </button>
        </div>

        {/* Search input */}
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="تصفية الملاحظات..."
          className="rounded-lg border border-majalis-gold/30 bg-majalis-card px-3 py-1.5 text-xs placeholder:text-majalis-ink/40 focus:border-majalis-gold focus:outline-none w-full sm:w-56"
        />
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-majalis-gold/20 bg-majalis-card p-10 text-center">
            <p className="text-sm text-majalis-ink/60">
              لا توجد مدونات مطابقة. يمكنك تدوين فوائدك أثناء دراسة أي مجلس، أو إضافة فائدة جديدة الآن.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group rounded-xl border p-4 transition-all duration-200 ${
                item.type === "commitment" && item.completed
                  ? "border-emerald-300/60 bg-emerald-500/5 dark:bg-emerald-950/10"
                  : "border-majalis-gold/30 bg-majalis-card hover:border-majalis-gold/70 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {item.type === "commitment" ? (
                    <button
                      onClick={() => toggleCommitment(item.id)}
                      className="mt-0.5 shrink-0 text-majalis-gold hover:text-majalis-green"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-majalis-ink/40" />
                      )}
                    </button>
                  ) : item.type === "reflection" ? (
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-majalis-gold" />
                  ) : (
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-majalis-green dark:text-emerald-400" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-medium text-base text-majalis-ink">
                        {item.title}
                      </span>
                      <span className="rounded bg-majalis-beige/80 px-2 py-0.5 text-[11px] text-majalis-ink/70">
                        {getTypeLabel(item.type)}
                      </span>
                      {item.bookTitle && (
                        <span className="text-[11px] text-majalis-gold">
                          · {item.bookTitle}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-majalis-ink/90 whitespace-pre-wrap">
                      {item.content}
                    </p>

                    {item.sessionTitle && item.sessionSlug && item.bookSlug && (
                      <div className="mt-3">
                        <Link
                          href={`/books/${item.bookSlug}/sessions/${item.sessionSlug}`}
                          className="inline-flex items-center gap-1 text-xs text-majalis-green hover:underline dark:text-emerald-400"
                        >
                          <span>← مراجعة المجلس: {item.sessionTitle}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-majalis-ink/40 hover:text-red-500 transition-opacity"
                  title="حذف من الدفتر"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add New Entry */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-majalis-gold/50 bg-majalis-card p-6 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg font-bold text-majalis-ink">
              تدوين فائدة أو التزام جديد
            </h2>
            <form onSubmit={handleAddItem} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-majalis-ink/70 mb-1">
                  نوع التدوين
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType("note")}
                    className={`rounded-lg py-1.5 text-xs font-medium border ${
                      newType === "note"
                        ? "border-majalis-gold bg-majalis-gold text-majalis-ink"
                        : "border-majalis-gold/30 bg-majalis-beige/40"
                    }`}
                  >
                    فائدة علمية
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("reflection")}
                    className={`rounded-lg py-1.5 text-xs font-medium border ${
                      newType === "reflection"
                        ? "border-majalis-gold bg-majalis-gold text-majalis-ink"
                        : "border-majalis-gold/30 bg-majalis-beige/40"
                    }`}
                  >
                    خاطرة وتزكية
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("commitment")}
                    className={`rounded-lg py-1.5 text-xs font-medium border ${
                      newType === "commitment"
                        ? "border-majalis-gold bg-majalis-gold text-majalis-ink"
                        : "border-majalis-gold/30 bg-majalis-beige/40"
                    }`}
                  >
                    تطبيق عملي
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-majalis-ink/70 mb-1">
                  الكتاب المتعلق
                </label>
                <select
                  value={newBook}
                  onChange={(e) => setNewBook(e.target.value)}
                  className="w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige/40 px-3 py-2 text-xs focus:border-majalis-gold focus:outline-none"
                >
                  <option value="الحكم العطائية">الحكم العطائية لسيدي ابن عطاء الله السكندري</option>
                  <option value="إحياء علوم الدين - كتاب العلم">إحياء علوم الدين - كتاب العلم</option>
                  <option value="فتح القريب المجيب">كتاب فتح القريب المجيب في شرح ألفاظ التقريب</option>
                  <option value="فائدة عامة">فائدة منهجية عامة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-majalis-ink/70 mb-1">
                  عنوان الفائدة أو الالتزام
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: ضبط نية التعلم، أو شروط الماء المطلق..."
                  className="w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige/40 px-3 py-2 text-xs focus:border-majalis-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-majalis-ink/70 mb-1">
                  التفاصيل والبيان
                </label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="اكتب ما استقر في ذهنك وقلبك..."
                  className="w-full rounded-lg border border-majalis-gold/30 bg-majalis-beige/40 px-3 py-2 text-xs focus:border-majalis-gold focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-majalis-gold/30 px-3 py-1.5 text-xs text-majalis-ink/70 hover:bg-majalis-beige/40"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-majalis-green px-4 py-1.5 text-xs font-medium text-majalis-goldSoft hover:bg-majalis-green/90"
                >
                  حفظ في الدفتر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
