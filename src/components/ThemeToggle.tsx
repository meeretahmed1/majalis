"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-majalis-gold/40 text-xs opacity-60">
        🌙
      </div>
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    if (typeof document !== "undefined") {
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "تفعيل المظهر النهاري" : "تفعيل المظهر الليلي"}
      title={isDark ? "تفعيل المظهر النهاري" : "تفعيل المظهر الليلي"}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-majalis-gold/40 hover:border-majalis-gold hover:bg-majalis-beige/40 transition-colors text-majalis-gold"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 text-majalis-gold" />
      )}
    </button>
  );
}