"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-md border border-hairline bg-canvas px-3 py-2 text-sm font-medium text-ink hover:bg-surface-soft"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
