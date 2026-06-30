"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme:    Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:    "system",
  resolved: "light",
  setTheme: () => {},
});

function resolveTheme(t: Theme): "light" | "dark" {
  if (t === "dark")  return "dark";
  if (t === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyClass(isDark: boolean) {
  const root = document.documentElement;
  // Brief transition class so colors animate smoothly
  root.classList.add("theme-transitioning");
  root.classList.toggle("dark", isDark);
  setTimeout(() => root.classList.remove("theme-transitioning"), 400);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme,    setThemeState] = useState<Theme>("system");
  const [resolved, setResolved]   = useState<"light" | "dark">("light");

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = (localStorage.getItem("airgrid-theme") as Theme) ?? "system";
    const res    = resolveTheme(stored);
    setThemeState(stored);
    setResolved(res);
    // DOM class is already set by the anti-flash script; no need to toggle again
  }, []);

  // Follow system preference changes when theme === "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const res = resolveTheme("system");
      applyClass(res === "dark");
      setResolved(res);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    const res = resolveTheme(t);
    setThemeState(t);
    setResolved(res);
    applyClass(res === "dark");
    localStorage.setItem("airgrid-theme", t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
