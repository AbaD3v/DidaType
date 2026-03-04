"use client";

import { useEffect } from "react";

const THEMES = [
  { name: "default", bg: "10 10 10", text: "245 245 245", muted: "170 170 170", accent: "255 215 0" },
  { name: "mint",    bg: "8 12 10",  text: "235 255 245", muted: "150 190 175", accent: "34 211 153" },
  { name: "purple",  bg: "10 8 16",  text: "245 240 255", muted: "170 160 200", accent: "168 85 247" },
  { name: "light",   bg: "245 245 245", text: "15 15 15", muted: "90 90 90", accent: "234 179 8" },
] as const;

type ThemeName = typeof THEMES[number]["name"];

function applyTheme(name: ThemeName) {
  const t = THEMES.find((x) => x.name === name) ?? THEMES[0];
  const r = document.documentElement;

  r.style.setProperty("--bg", t.bg);
  r.style.setProperty("--text", t.text);
  r.style.setProperty("--muted", t.muted);
  r.style.setProperty("--accent", t.accent);

  localStorage.setItem("theme", t.name);
}

export default function ThemeBar() {
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as ThemeName | null) ?? "default";
    applyTheme(saved);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[rgb(var(--muted))] text-sm mr-2">theme</span>

      {THEMES.map((t) => (
        <button
          key={t.name}
          type="button"
          onClick={() => applyTheme(t.name)}
          className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm"
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}