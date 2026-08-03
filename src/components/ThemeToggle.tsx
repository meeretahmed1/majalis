"use client";

import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-lg border border-majalis-gold/40 px-3 py-1"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}