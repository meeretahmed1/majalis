"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  ChevronDown,
  ChevronLeft,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  GitFork,
  Maximize2,
  Minimize2,
  FileText,
  Share2,
} from "lucide-react";

export interface MindMapNodeData {
  id: string;
  title: string;
  detail?: string;
  children: MindMapNodeData[];
  level: number;
  colorIndex: number;
}

const BRANCH_COLORS = [
  {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-500/40 hover:border-emerald-500",
    headerBg: "bg-emerald-700 text-white",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700",
    bullet: "bg-emerald-600",
    line: "border-emerald-300 dark:border-emerald-700",
    glow: "shadow-emerald-500/10",
    tag: "text-emerald-700 dark:text-emerald-300",
  },
  {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-500/40 hover:border-amber-500",
    headerBg: "bg-amber-700 text-white",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700",
    bullet: "bg-amber-600",
    line: "border-amber-300 dark:border-amber-700",
    glow: "shadow-amber-500/10",
    tag: "text-amber-700 dark:text-amber-300",
  },
  {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-500/40 hover:border-blue-500",
    headerBg: "bg-blue-700 text-white",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border-blue-300 dark:border-blue-700",
    bullet: "bg-blue-600",
    line: "border-blue-300 dark:border-blue-700",
    glow: "shadow-blue-500/10",
    tag: "text-blue-700 dark:text-blue-300",
  },
  {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-500/40 hover:border-rose-500",
    headerBg: "bg-rose-700 text-white",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border-rose-300 dark:border-rose-700",
    bullet: "bg-rose-600",
    line: "border-rose-300 dark:border-rose-700",
    glow: "shadow-rose-500/10",
    tag: "text-rose-700 dark:text-rose-300",
  },
  {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-500/40 hover:border-purple-500",
    headerBg: "bg-purple-700 text-white",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-300 dark:border-purple-700",
    bullet: "bg-purple-600",
    line: "border-purple-300 dark:border-purple-700",
    glow: "shadow-purple-500/10",
    tag: "text-purple-700 dark:text-purple-300",
  },
  {
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-500/40 hover:border-teal-500",
    headerBg: "bg-teal-700 text-white",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 border-teal-300 dark:border-teal-700",
    bullet: "bg-teal-600",
    line: "border-teal-300 dark:border-teal-700",
    glow: "shadow-teal-500/10",
    tag: "text-teal-700 dark:text-teal-300",
  },
];

function cleanTitle(raw: string) {
  // Strip leading numbering, bullets, letters like "1.", "١.", "-", "*", "أ.", "ب."
  return raw
    .replace(/^(\d+|[٠-٩]+)[\.\-\)]\s*/, "")
    .replace(/^[\-\*\•\–]\s*/, "")
    .replace(/^[أ-يa-zA-Z][\.\-\)]\s*/, "")
    .replace(/^#+\s*/, "")
    .trim();
}

function parseDetail(raw: string): { title: string; detail?: string } {
  const cleaned = cleanTitle(raw);
  // Split on first colon if exists and not part of URL
  const colonIndex = cleaned.indexOf(":");
  if (colonIndex > 0 && colonIndex < cleaned.length - 1 && !cleaned.includes("http")) {
    const title = cleaned.slice(0, colonIndex).trim();
    const detail = cleaned.slice(colonIndex + 1).trim();
    if (detail.length > 0) {
      return { title, detail };
    }
  }
  return { title: cleaned };
}

export function parseOutlineData(outlineText: string, fallbackRoot: string = "المجلس العلمي") {
  if (!outlineText || !outlineText.trim()) {
    return { rootTitle: fallbackRoot, branches: [] };
  }

  const lines = outlineText
    .split("\n")
    .map((l) => l.replace(/\r/g, ""))
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { rootTitle: fallbackRoot, branches: [] };
  }

  // Detect whether format is indentation-based or sequentially numbered
  const isNumbered = lines.some((l) => /^(\d+|[٠-٩]+)[\.\-\)]/.test(l.trim()));
  const hasIndents = lines.some((l) => /^\s{2,}/.test(l));

  let rootTitle = fallbackRoot;
  const branches: MindMapNodeData[] = [];

  if (hasIndents && !isNumbered) {
    // Pure indentation tree
    let firstLine = lines[0];
    if (/^\S/.test(firstLine) && lines.length > 1 && /^\s+/.test(lines[1])) {
      rootTitle = cleanTitle(firstLine);
      lines.shift();
    }

    const stack: { node: { children: MindMapNodeData[] }; indent: number } = {
      node: { children: branches },
      indent: -1,
    };
    const nodeStack = [stack];

    lines.forEach((line, idx) => {
      const indent = line.match(/^\s*/)?.[0].length ?? 0;
      const { title, detail } = parseDetail(line);

      const newNode: MindMapNodeData = {
        id: `node-${idx}-${indent}`,
        title,
        detail,
        children: [],
        level: indent > 0 ? 1 : 0,
        colorIndex: 0,
      };

      while (nodeStack.length > 1 && indent <= nodeStack[nodeStack.length - 1].indent) {
        nodeStack.pop();
      }

      const parent = nodeStack[nodeStack.length - 1];
      parent.node.children.push(newNode);
      nodeStack.push({ node: newNode, indent });
    });
  } else {
    // Numbered or sequential blocks (1., 2., or ١., ٢.)
    let currentBranch: MindMapNodeData | null = null;
    let branchCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const isMainBranch = /^(\d+|[٠-٩]+)[\.\-\)]/.test(trimmed) || (!currentBranch && /^\S/.test(trimmed));

      if (isMainBranch) {
        const { title, detail } = parseDetail(trimmed);
        currentBranch = {
          id: `branch-${branchCount}`,
          title,
          detail,
          children: [],
          level: 0,
          colorIndex: branchCount % BRANCH_COLORS.length,
        };
        branches.push(currentBranch);
        branchCount++;
      } else if (currentBranch) {
        const { title, detail } = parseDetail(trimmed);
        currentBranch.children.push({
          id: `child-${branchCount}-${currentBranch.children.length}`,
          title,
          detail,
          children: [],
          level: 1,
          colorIndex: currentBranch.colorIndex,
        });
      } else {
        // Line before any branch: might be root title
        rootTitle = cleanTitle(trimmed);
      }
    }
  }

  // Ensure color indexing
  branches.forEach((b, idx) => {
    b.colorIndex = idx % BRANCH_COLORS.length;
    b.children.forEach((c) => {
      c.colorIndex = b.colorIndex;
    });
  });

  return { rootTitle, branches };
}

interface VisualMindMapProps {
  outline?: string;
  sessionTitle?: string;
  bookTitle?: string;
}

export function VisualMindMap({ outline, sessionTitle = "المجلس العلمي", bookTitle }: VisualMindMapProps) {
  const [viewMode, setViewMode] = useState<"visual" | "tree" | "text">("visual");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  const { rootTitle, branches } = useMemo(() => {
    return parseOutlineData(outline ?? "", sessionTitle);
  }, [outline, sessionTitle]);

  // Total nodes calculation
  const stats = useMemo(() => {
    let totalSubs = 0;
    let totalDetails = 0;
    branches.forEach((b) => {
      totalSubs += b.children.length;
      if (b.detail) totalDetails++;
      b.children.forEach((c) => {
        if (c.detail) totalDetails++;
      });
    });
    return {
      mainCount: branches.length,
      subCount: totalSubs,
      termsCount: totalDetails,
    };
  }, [branches]);

  // Initial expand all branches
  React.useEffect(() => {
    const initial: Record<string, boolean> = {};
    branches.forEach((b) => {
      initial[b.id] = true;
    });
    setExpandedBranches(initial);
  }, [branches]);

  const toggleBranch = (id: string) => {
    setExpandedBranches((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    branches.forEach((b) => {
      all[b.id] = true;
    });
    setExpandedBranches(all);
  };

  const collapseAll = () => {
    setExpandedBranches({});
  };

  const handleCopy = () => {
    if (outline) {
      navigator.clipboard.writeText(outline);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter branches based on search query
  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branches;
    const q = searchQuery.trim().toLowerCase();
    return branches.filter((b) => {
      const matchMain = b.title.toLowerCase().includes(q) || (b.detail && b.detail.toLowerCase().includes(q));
      const matchChildren = b.children.some(
        (c) => c.title.toLowerCase().includes(q) || (c.detail && c.detail.toLowerCase().includes(q))
      );
      return matchMain || matchChildren;
    });
  }, [branches, searchQuery]);

  if (!outline || !outline.trim() || branches.length === 0) {
    return (
      <div className="rounded-2xl border border-majalis-gold/30 bg-majalis-card p-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-majalis-gold/10 text-majalis-gold">
          <GitFork className="h-7 w-7" />
        </div>
        <h3 className="font-display text-lg font-bold text-majalis-ink">الخريطة الذهنية قيد الإعداد</h3>
        <p className="mt-1 text-sm text-majalis-ink/60 max-w-md mx-auto leading-relaxed">
          لم يتم تضمين مخطط ذهني مفصّل لهذا المجلس بعد. يمكنك الاستعانة بالملخص والبطاقات التعليمية لمراجعة أهم أفكار الدرس.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none" dir="rtl">
      {/* Top Toolbar */}
      <div className="rounded-2xl border border-majalis-gold/30 bg-majalis-card p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-majalis-sand/30 p-1 rounded-xl border border-majalis-gold/20 text-xs">
          <button
            onClick={() => setViewMode("visual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === "visual"
                ? "bg-majalis-green text-majalis-goldSoft shadow-sm"
                : "text-majalis-ink/70 hover:text-majalis-ink"
            }`}
          >
            <GitFork className="h-3.5 w-3.5" />
            <span>خريطة مرئية</span>
          </button>
          <button
            onClick={() => setViewMode("tree")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === "tree"
                ? "bg-majalis-green text-majalis-goldSoft shadow-sm"
                : "text-majalis-ink/70 hover:text-majalis-ink"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>هيكل شجري</span>
          </button>
          <button
            onClick={() => setViewMode("text")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === "text"
                ? "bg-majalis-green text-majalis-goldSoft shadow-sm"
                : "text-majalis-ink/70 hover:text-majalis-ink"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>نص المخطط</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-majalis-ink/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في محاور الخريطة..."
            className="w-full rounded-xl border border-majalis-gold/30 bg-white/70 dark:bg-stone-900/60 py-1.5 pr-8 pl-3 text-xs placeholder:text-majalis-ink/40 focus:border-majalis-gold focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-majalis-ink/40 hover:text-majalis-ink"
            >
              ×
            </button>
          )}
        </div>

        {/* Quick Actions (Expand, Collapse, Zoom, Copy) */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={expandAll}
            title="توسيع الكل"
            className="rounded-lg border border-majalis-gold/20 bg-white/60 dark:bg-stone-900/40 px-2 py-1.5 text-majalis-ink/70 hover:border-majalis-gold hover:text-majalis-ink flex items-center gap-1"
          >
            <Maximize2 className="h-3 w-3" />
            <span className="hidden sm:inline">توسيع</span>
          </button>
          <button
            onClick={collapseAll}
            title="طي الكل"
            className="rounded-lg border border-majalis-gold/20 bg-white/60 dark:bg-stone-900/40 px-2 py-1.5 text-majalis-ink/70 hover:border-majalis-gold hover:text-majalis-ink flex items-center gap-1"
          >
            <Minimize2 className="h-3 w-3" />
            <span className="hidden sm:inline">طي</span>
          </button>

          {viewMode === "visual" && (
            <div className="flex items-center gap-1 border-r border-majalis-gold/20 pr-1 mr-1">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 1.3))}
                title="تكبير"
                className="rounded-lg p-1.5 hover:bg-majalis-sand/30 text-majalis-ink/70"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.8))}
                title="تصغير"
                className="rounded-lg p-1.5 hover:bg-majalis-sand/30 text-majalis-ink/70"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                title="إعادة ضبط الحجم"
                className="rounded-lg p-1.5 hover:bg-majalis-sand/30 text-majalis-ink/70"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            title="نسخ المخطط"
            className="rounded-lg border border-majalis-gold/20 bg-white/60 dark:bg-stone-900/40 p-1.5 text-majalis-ink/70 hover:border-majalis-gold hover:text-majalis-ink"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="flex items-center justify-between text-xs text-majalis-ink/70 px-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-majalis-gold" />
            <span>{stats.mainCount} محاور رئيسية</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-majalis-green" />
            <span>{stats.subCount} تفريعات وشروح</span>
          </span>
          {stats.termsCount > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-majalis-gold">
              <Sparkles className="h-3 w-3" />
              <span>{stats.termsCount} مصطلحات وتعريفات</span>
            </span>
          )}
        </div>
        {searchQuery && (
          <span className="text-amber-600 font-medium">
            نتائج البحث: {filteredBranches.length} محور
          </span>
        )}
      </div>

      {/* 1. VISUAL MIND MAP CANVAS VIEW */}
      {viewMode === "visual" && (
        <div
          className="rounded-2xl border border-majalis-gold/30 bg-gradient-to-b from-majalis-card via-white/80 to-majalis-card/90 dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950 p-6 md:p-8 shadow-inner overflow-x-auto transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}
        >
          {/* Root Central Topic Node */}
          <div className="flex flex-col items-center mb-8 relative">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-majalis-gold via-majalis-green to-majalis-gold opacity-30 blur-sm group-hover:opacity-60 transition duration-500" />
              <div className="relative rounded-2xl border-2 border-majalis-gold bg-majalis-card dark:bg-stone-900 px-6 py-4 shadow-lg text-center max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-majalis-gold/15 text-majalis-gold text-xs font-semibold mb-1.5 border border-majalis-gold/30">
                  <BookOpen className="h-3 w-3" />
                  <span>المحور المركزي للمجلس</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-majalis-green dark:text-majalis-goldSoft">
                  {rootTitle}
                </h2>
                {bookTitle && (
                  <p className="mt-1 text-xs text-majalis-ink/60">من كتاب: {bookTitle}</p>
                )}
              </div>
            </div>

            {/* Central Connector Trunk Line */}
            <div className="w-0.5 h-8 bg-gradient-to-b from-majalis-gold to-majalis-gold/40 mt-1" />
            <div className="w-3 h-3 rounded-full bg-majalis-gold shadow-sm -mt-1" />
          </div>

          {/* Primary Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBranches.map((branch, index) => {
              const color = BRANCH_COLORS[branch.colorIndex % BRANCH_COLORS.length];
              const isExpanded = expandedBranches[branch.id] !== false;
              const hasChildren = branch.children.length > 0;
              const isFocused = activeBranchId === branch.id;

              return (
                <div
                  key={branch.id}
                  onClick={() => setActiveBranchId(isFocused ? null : branch.id)}
                  className={`flex flex-col rounded-2xl border transition-all duration-300 ${
                    color.bg
                  } ${color.border} ${color.glow} ${
                    isFocused
                      ? "ring-2 ring-majalis-gold shadow-xl scale-[1.02]"
                      : "shadow-md hover:shadow-lg"
                  }`}
                >
                  {/* Branch Header */}
                  <div className="p-4 border-b border-majalis-gold/20 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span
                        className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shadow-sm ${color.headerBg}`}
                      >
                        {(index + 1).toLocaleString("ar-EG")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-base leading-snug text-majalis-ink dark:text-stone-100">
                          {branch.title}
                        </h3>
                        {branch.detail && (
                          <div className={`mt-1 text-xs leading-relaxed font-normal ${color.tag}`}>
                            {branch.detail}
                          </div>
                        )}
                      </div>
                    </div>

                    {hasChildren && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBranch(branch.id);
                        }}
                        className="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-majalis-ink/60 transition-transform"
                        title={isExpanded ? "طي المحور" : "توسيع المحور"}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Branch Sub-Nodes Body */}
                  {hasChildren && isExpanded && (
                    <div className="p-4 space-y-3 flex-1">
                      {branch.children.map((child, cIdx) => (
                        <div key={child.id} className="relative pr-4">
                          {/* Connector Tree Guide */}
                          <div
                            className={`absolute right-0 top-3 bottom-0 w-0.5 ${color.line} opacity-70`}
                          />
                          <div
                            className={`absolute right-[-3px] top-2.5 h-2 w-2 rounded-full ${color.bullet}`}
                          />

                          <div className="rounded-xl border border-majalis-gold/15 bg-white/80 dark:bg-stone-900/70 p-2.5 shadow-xs hover:border-majalis-gold/40 transition-colors">
                            <div className="text-xs font-semibold text-majalis-ink dark:text-stone-200">
                              {child.title}
                            </div>
                            {child.detail && (
                              <p className="mt-1 text-[11px] leading-relaxed text-majalis-ink/75 dark:text-stone-400">
                                {child.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Branch Footer Badge */}
                  <div className="px-4 py-2 border-t border-majalis-gold/10 flex items-center justify-between text-[11px] text-majalis-ink/50">
                    <span>
                      {branch.children.length > 0
                        ? `${branch.children.length} تفريعات فرعية`
                        : "فكرة رئيسية مفردة"}
                    </span>
                    <span className="text-majalis-gold font-medium">
                      {isExpanded ? "منشور" : "مطوي"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. INTERACTIVE HIERARCHICAL TREE VIEW */}
      {viewMode === "tree" && (
        <div className="rounded-2xl border border-majalis-gold/30 bg-majalis-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 pb-4 border-b border-majalis-gold/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-majalis-green text-majalis-goldSoft shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-majalis-ink dark:text-stone-100">
                {rootTitle}
              </h2>
              <p className="text-xs text-majalis-ink/60">
                هيكل شجري متسلسل مرتب حسب أبواب ومسائل المجلس
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {filteredBranches.map((branch, idx) => {
              const color = BRANCH_COLORS[branch.colorIndex % BRANCH_COLORS.length];
              const isExpanded = expandedBranches[branch.id] !== false;

              return (
                <div
                  key={branch.id}
                  className="rounded-xl border border-majalis-gold/25 bg-white/70 dark:bg-stone-900/60 overflow-hidden shadow-xs"
                >
                  <div
                    onClick={() => toggleBranch(branch.id)}
                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-majalis-sand/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${color.headerBg}`}
                      >
                        {(idx + 1).toLocaleString("ar-EG")}
                      </span>
                      <span className="font-display font-bold text-sm text-majalis-ink dark:text-stone-100">
                        {branch.title}
                      </span>
                      {branch.children.length > 0 && (
                        <span className="rounded-full bg-majalis-sand/50 px-2 py-0.5 text-[10px] text-majalis-ink/60">
                          {branch.children.length}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-majalis-ink/50 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {branch.detail && (
                    <div className="px-4 pb-2 text-xs text-majalis-ink/70">
                      {branch.detail}
                    </div>
                  )}

                  {isExpanded && branch.children.length > 0 && (
                    <div className="border-t border-majalis-gold/15 bg-majalis-card/50 dark:bg-stone-950/40 p-3 space-y-2 pr-8">
                      {branch.children.map((c, cIdx) => (
                        <div
                          key={c.id}
                          className="flex items-start gap-2.5 text-xs text-majalis-ink/90 dark:text-stone-300"
                        >
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-majalis-gold shrink-0" />
                          <div>
                            <span className="font-semibold">{c.title}</span>
                            {c.detail && (
                              <span className="mr-1 text-majalis-ink/70 dark:text-stone-400">
                                : {c.detail}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. STRUCTURED TEXT / OUTLINE VIEW */}
      {viewMode === "text" && (
        <div className="rounded-2xl border border-majalis-gold/30 bg-majalis-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-majalis-gold/20">
            <h3 className="font-display font-bold text-base text-majalis-ink">
              نص المخطط الذهني الكامل
            </h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-majalis-green hover:text-majalis-gold font-medium"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "تم النسخ" : "نسخ النص"}</span>
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-xs leading-7 text-majalis-ink/80 dark:text-stone-300 bg-white/60 dark:bg-stone-900/50 p-4 rounded-xl border border-majalis-gold/15 overflow-x-auto">
            {outline}
          </pre>
        </div>
      )}
    </div>
  );
}
