// src/components/ThemeBar.tsx
"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

const THEMES = [
  { name: "default", bg: "44 46 49", text: "209 208 197", muted: "100 102 105", accent: "226 183 20" },
  { name: "mint",    bg: "8 12 10",   text: "235 255 245", muted: "150 190 175", accent: "34 211 153" },
  { name: "purple",  bg: "10 8 16",   text: "245 240 255", muted: "170 160 200", accent: "168 85 247" },
  { name: "light",   bg: "245 245 245", text: "15 15 15", muted: "90 90 90", accent: "234 179 8" },
] as const;

type ThemeName = typeof THEMES[number]["name"];

export default function ThemeBar() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>("default");

  const applyTheme = (name: ThemeName) => {
    const t = THEMES.find((x) => x.name === name) ?? THEMES[0];
    const r = document.documentElement;

    r.style.setProperty("--bg", t.bg);
    r.style.setProperty("--text", t.text);
    r.style.setProperty("--muted", t.muted);
    r.style.setProperty("--accent", t.accent);

    localStorage.setItem("theme", t.name);
    setCurrentTheme(t.name);
  };

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as ThemeName | null) ?? "default";
    applyTheme(saved);
  }, []);

  return (
    <div className="flex items-center gap-4 bg-[rgb(var(--bg))] py-1 px-3 rounded-md border border-[rgb(var(--muted))]/10">
      <div className="flex items-center gap-2 text-[rgb(var(--muted))]">
        <Palette size={14} strokeWidth={1.5} />
        <span className="text-[11px] uppercase tracking-wider font-bold">theme</span>
      </div>

      <div className="flex items-center gap-1">
        {THEMES.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => applyTheme(t.name)}
            className={`
              px-2 py-0.5 text-[12px] transition-all duration-200 rounded
              ${currentTheme === t.name 
                ? "text-[rgb(var(--accent))] font-bold" 
                : "text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]"}
            `}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}