"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit3,
  Check,
  Loader2,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";

export interface SessionItem {
  id: string;
  title: string;
  slug: string;
  orderInBook: number;
  status: string;
  duration?: string | null;
  date?: string | null;
}

interface AdminSessionReorderListProps {
  sectionId: string;
  initialSessions: SessionItem[];
  onOrderChanged?: (sessions: SessionItem[]) => void;
}

export default function AdminSessionReorderList({
  sectionId,
  initialSessions,
  onOrderChanged,
}: AdminSessionReorderListProps) {
  const [sessions, setSessions] = useState<SessionItem[]>(
    [...initialSessions].sort((a, b) => a.orderInBook - b.orderInBook)
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [hasChanges, setHasChanges] = useState(false);

  const saveNewOrder = async (newSessions: SessionItem[]) => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/admin/sessions/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          orderedIds: newSessions.map((s) => s.id),
        }),
      });

      if (!res.ok) {
        throw new Error("فشل في حفظ الترتيب");
      }

      setSaveStatus("saved");
      setHasChanges(false);
      if (onOrderChanged) {
        onOrderChanged(newSessions);
      }
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2500);
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const reorderList = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updated = [...sessions];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    // Re-assign orderInBook sequentially
    const reindexed = updated.map((item, idx) => ({
      ...item,
      orderInBook: idx + 1,
    }));

    setSessions(reindexed);
    setHasChanges(true);
    saveNewOrder(reindexed);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    // only clear if leaving component boundary
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    reorderList(draggedIndex, targetIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Keyboard / Touch Up and Down buttons
  const moveUp = (index: number) => {
    if (index > 0) {
      reorderList(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < sessions.length - 1) {
      reorderList(index, index + 1);
    }
  };

  if (sessions.length === 0) {
    return (
      <p className="text-xs text-majalis-ink/50 py-2">
        لا توجد مجالس في هذا الباب بعد.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Action and feedback bar */}
      <div className="flex items-center justify-between text-xs text-majalis-ink/60 mb-1 px-1">
        <span className="flex items-center gap-1.5 text-[11px]">
          <ArrowUpDown className="w-3.5 h-3.5 text-majalis-gold" />
          اسحب المجالس لإعادة ترتيبها أو استخدم الأسهم:
        </span>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="flex items-center gap-1 text-majalis-gold text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              جارٍ الحفظ...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
              <Check className="w-3.5 h-3.5" />
              تم حفظ الترتيب
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-red-500 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              تعذر الحفظ
            </span>
          )}
        </div>
      </div>

      {/* Draggable session items */}
      <div className="flex flex-col gap-1.5">
        {sessions.map((session, index) => {
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index && draggedIndex !== index;

          return (
            <div
              key={session.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center justify-between gap-2 rounded-xl border bg-majalis-card px-3 py-2.5 transition-all select-none ${
                isDragging
                  ? "opacity-40 scale-[0.98] border-dashed border-majalis-gold shadow-sm"
                  : isDragOver
                  ? "border-majalis-gold bg-majalis-gold/10 shadow-md translate-y-0.5"
                  : "border-majalis-gold/25 hover:border-majalis-gold/60 hover:shadow-xs"
              }`}
            >
              {/* Drag Handle & Order */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  aria-label="اسحب لإعادة الترتيب"
                  className="cursor-grab active:cursor-grabbing p-1 text-majalis-ink/40 hover:text-majalis-gold hover:bg-majalis-beige rounded transition-colors touch-none"
                  title="اسحب لتغيير الترتيب"
                >
                  <GripVertical className="w-4 h-4" />
                </button>

                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-majalis-beige border border-majalis-gold/30 text-xs font-semibold text-majalis-ink">
                  {session.orderInBook}
                </span>

                <div className="min-w-0 truncate">
                  <div className="text-sm font-medium truncate text-majalis-ink">
                    {session.title}
                  </div>
                  {session.duration && (
                    <div className="text-[11px] text-majalis-ink/50">
                      {session.duration}
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    session.status === "PUBLISHED"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {session.status === "PUBLISHED" ? "منشور" : "مسودة"}
                </span>

                {/* Up/Down buttons for mobile touch & accessibility */}
                <div className="flex items-center gap-0.5 border-r border-majalis-gold/20 pr-1.5">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0 || isSaving}
                    aria-label="تقديم المجلس"
                    title="تحريك لأعلى"
                    className="p-1 text-majalis-ink/50 hover:text-majalis-ink hover:bg-majalis-beige rounded disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === sessions.length - 1 || isSaving}
                    aria-label="تأخير المجلس"
                    title="تحريك لأسفل"
                    className="p-1 text-majalis-ink/50 hover:text-majalis-ink hover:bg-majalis-beige rounded disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Edit Button */}
                <Link
                  href={`/admin/sessions/${session.id}/edit`}
                  className="flex items-center gap-1 rounded-lg border border-majalis-gold/30 bg-majalis-beige/60 px-2.5 py-1 text-xs text-majalis-ink/80 hover:bg-majalis-beige hover:border-majalis-gold transition-colors"
                  title="تعديل تفاصيل المجلس"
                >
                  <Edit3 className="w-3 h-3 text-majalis-gold" />
                  <span>تعديل</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
