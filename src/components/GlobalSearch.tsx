"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Book, Layers, Sparkles, Navigation, X, CornerDownLeft } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: "book" | "session" | "term" | "navigation";
  href: string;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchResults("");
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  const fetchResults = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    fetchResults(val);
  };

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex].href);
    }
  };

  const getCategoryBadge = (category: SearchResult["category"]) => {
    switch (category) {
      case "book":
        return (
          <span className="flex items-center gap-1 rounded bg-majalis-gold/20 px-1.5 py-0.5 text-[11px] font-medium text-majalis-gold">
            <Book className="h-3 w-3" /> كتاب
          </span>
        );
      case "session":
        return (
          <span className="flex items-center gap-1 rounded bg-majalis-green/10 px-1.5 py-0.5 text-[11px] font-medium text-majalis-green dark:text-emerald-400">
            <Layers className="h-3 w-3" /> مجلس
          </span>
        );
      case "term":
        return (
          <span className="flex items-center gap-1 rounded bg-purple-500/10 px-1.5 py-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
            <Sparkles className="h-3 w-3" /> مصطلح
          </span>
        );
      case "navigation":
      default:
        return (
          <span className="flex items-center gap-1 rounded bg-stone-500/10 px-1.5 py-0.5 text-[11px] font-medium text-stone-600 dark:text-stone-400">
            <Navigation className="h-3 w-3" /> وجهة
          </span>
        );
    }
  };

  return (
    <>
      {/* Trigger Button to export or dispatch */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-majalis-gold/40 bg-majalis-beige/40 px-2.5 py-1 text-xs text-majalis-ink/70 hover:border-majalis-gold hover:text-majalis-ink transition-colors"
        title="بحث سريع (Ctrl + K)"
      >
        <Search className="h-3.5 w-3.5 text-majalis-gold" />
        <span className="hidden sm:inline">ابحث في المجالس...</span>
        <span className="inline sm:hidden">بحث</span>
        <kbd className="hidden sm:inline rounded bg-majalis-sand/40 px-1.5 py-0.5 text-[10px] font-mono text-majalis-ink/50 border border-majalis-gold/20">
          Ctrl K
        </kbd>
      </button>

      {/* Modal Backdrop & Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 sm:pt-24 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-majalis-gold/40 bg-majalis-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyNav}
          >
            {/* Search Input Bar */}
            <div className="flex items-center border-b border-majalis-gold/30 px-4 py-3">
              <Search className="h-5 w-5 text-majalis-gold shrink-0 ml-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={handleQueryChange}
                placeholder="ابحث باسم الكتاب، المجلس، المصطلح، أو الفائدة..."
                className="w-full bg-transparent text-sm text-majalis-ink placeholder:text-majalis-ink/40 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    fetchResults("");
                  }}
                  className="p-1 text-majalis-ink/40 hover:text-majalis-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loading && (
                <div className="py-8 text-center text-xs text-majalis-ink/50">
                  جارٍ استرجاع النتائج...
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="py-8 text-center text-xs text-majalis-ink/50">
                  لم يتم العثور على نتائج تطابق &quot;{query}&quot;
                </div>
              )}

              {!loading && results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.href)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-majalis-beige border border-majalis-gold/50"
                        : "hover:bg-majalis-beige/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">{getCategoryBadge(item.category)}</div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-majalis-ink truncate font-display">
                          {item.title}
                        </div>
                        <div className="text-xs text-majalis-ink/60 truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-majalis-gold shrink-0 mr-2" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-majalis-gold/20 bg-majalis-beige/30 px-4 py-2 text-[11px] text-majalis-ink/50">
              <div className="flex items-center gap-3">
                <span>استخدم <kbd className="font-mono font-bold">↑</kbd> <kbd className="font-mono font-bold">↓</kbd> للتنقل</span>
                <span><kbd className="font-mono font-bold">↵</kbd> للاختيار</span>
              </div>
              <div>
                <span><kbd className="font-mono font-bold">ESC</kbd> للإغلاق</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
