"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="تبديل المظهر"
        className="rounded-lg border border-majalis-gold/40 px-3 py-1 opacity-70"
      >
        🌙
      </button>
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="تبديل المظهر"
      className="rounded-lg border border-majalis-gold/40 px-3 py-1 hover:border-majalis-gold transition-colors"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}