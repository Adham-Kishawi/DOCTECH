"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * ThemeToggle - Temporarily set to permanent Dark Mode.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark">("dark");

  useEffect(() => {
    // Enforce Dark Mode
    document.documentElement.classList.add("dark");
    localStorage.setItem("doctech_theme", "dark");
  }, []);

  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 bg-slate-800 border border-slate-700 shadow-xs"
      title="Dark Mode (Active)"
    >
      <Moon size={15} className="text-blue-400" />
    </div>
  );
}