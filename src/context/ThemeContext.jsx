import { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export default function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      setIsDark(saved === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const colors = isDark ? {
    bg: "#0f172a",
    bgSecondary: "#1a202c",
    bgTertiary: "#111827",
    text: "#ffffff",
    textSecondary: "#94a3b8",
    border: "rgba(255,255,255,.08)",
    hero: "linear-gradient(135deg,#2d5bff 0%,#1f48dc 35%,#172554 100%)",
    card: "#111827",
    primary: "#2563eb",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f97316",
    purple: "#7c3aed",
  } : {
    bg: "#ffffff",
    bgSecondary: "#f8fafc",
    bgTertiary: "#f1f5f9",
    text: "#0f172a",
    textSecondary: "#64748b",
    border: "rgba(0,0,0,.08)",
    hero: "linear-gradient(135deg,#2d5bff 0%,#1f48dc 35%,#172554 100%)",
    card: "#ffffff",
    primary: "#2563eb",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f97316",
    purple: "#7c3aed",
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}
