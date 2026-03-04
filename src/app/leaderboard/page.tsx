"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/hooks/utils/supabase/client";

type Row = {
  id: string;
  wpm: number;
  accuracy: number;
  errors: number;
  created_at: string;
  mode: "time" | "words";
  time_limit_sec: number | null;
  words_count: number | null;
  username: string | null;
};

export default function LeaderboardPage() {
  const supabase = createSupabaseBrowser();

  const [mode, setMode] = useState<"time" | "words">("time");
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [wordsCount, setWordsCount] = useState<number>(25);
  const [rows, setRows] = useState<Row[]>([]);

  const title = useMemo(() => {
    return mode === "time" ? `time ${timeLimit}s` : `words ${wordsCount}`;
  }, [mode, timeLimit, wordsCount]);

  useEffect(() => {
    (async () => {
      let q = supabase
        .from("typing_results_with_username")
        .select("id,wpm,accuracy,errors,created_at,mode,time_limit_sec,words_count,username")
        .eq("mode", mode)
        .order("wpm", { ascending: false })
        .limit(50);

      if (mode === "time") q = q.eq("time_limit_sec", timeLimit);
      if (mode === "words") q = q.eq("words_count", wordsCount);

      q = q.lte("wpm", 250).gte("accuracy", 0).lte("accuracy", 100);

      const { data } = await q;
      setRows((data as Row[]) ?? []);
    })();
  }, [mode, timeLimit, wordsCount, supabase]);

  // Базовые стили для кнопок-фильтров
  const btnBase = "px-4 py-1.5 rounded-lg text-sm transition-all duration-200 font-mono";
  const btnActive = `${btnBase} bg-[rgb(var(--accent))] text-[rgb(var(--bg))] font-bold shadow-lg shadow-[rgb(var(--accent))]/10`;
  const btnInactive = `${btnBase} bg-[rgb(var(--sub))]/10 text-[rgb(var(--sub))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--sub))]/20`;

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))] font-mono">
      <div className="max-w-5xl mx-auto px-8 py-16">
        
        {/* Header Section */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-[rgb(var(--sub))] text-sm tracking-[0.3em] uppercase opacity-50 mb-1">all-time high</div>
            <h1 className="text-4xl font-black flex items-center gap-3">
              <svg className="w-8 h-8 text-[rgb(var(--accent))]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              leaderboard
            </h1>
          </div>

          <div className="flex gap-3">
            <a href="/" className="px-5 py-2 rounded-xl bg-[rgb(var(--sub))]/10 hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--bg))] transition-all font-bold text-sm">
              back to test
            </a>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-black/10 p-2 rounded-2xl mb-8 w-fit">
          <div className="flex gap-1">
            <button onClick={() => setMode("time")} className={mode === "time" ? btnActive : btnInactive}>time</button>
            <button onClick={() => setMode("words")} className={mode === "words" ? btnActive : btnInactive}>words</button>
          </div>

          <div className="w-px h-6 bg-[rgb(var(--sub))]/20" />

          <div className="flex gap-1">
            {mode === "time" ? (
              [15, 30, 60].map((s) => (
                <button key={s} onClick={() => setTimeLimit(s)} className={timeLimit === s ? btnActive : btnInactive}>
                  {s}s
                </button>
              ))
            ) : (
              [10, 25, 50].map((n) => (
                <button key={n} onClick={() => setWordsCount(n)} className={wordsCount === n ? btnActive : btnInactive}>
                  {n}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-2xl border border-[rgb(var(--sub))]/10 bg-black/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[rgb(var(--sub))]/5 text-[rgb(var(--sub))] text-xs uppercase tracking-widest">
                <th className="px-6 py-4 font-medium w-16">#</th>
                <th className="px-6 py-4 font-medium">user</th>
                <th className="px-6 py-4 font-medium">wpm</th>
                <th className="px-6 py-4 font-medium">accuracy</th>
                <th className="px-6 py-4 font-medium">errors</th>
                <th className="px-6 py-4 font-medium text-right">date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgb(var(--sub))]/5">
              {rows.map((r, i) => (
                <tr key={r.id} className="hover:bg-[rgb(var(--accent))]/5 transition-colors group">
                  <td className="px-6 py-4 text-[rgb(var(--sub))] group-hover:text-[rgb(var(--accent))] transition-colors">
                    {i + 1}
                  </td>
                  <td className="px-6 py-4">
                    {r.username ? (
                      <span className="text-[rgb(var(--text))] font-bold">{r.username}</span>
                    ) : (
                      <span className="text-[rgb(var(--sub))] italic">anonymous</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-2xl font-black text-[rgb(var(--accent))]">{r.wpm}</span>
                  </td>
                  <td className="px-6 py-4 font-medium">{r.accuracy}%</td>
                  <td className="px-6 py-4 text-[rgb(var(--error))] opacity-80">{r.errors}</td>
                  <td className="px-6 py-4 text-[rgb(var(--sub))] text-sm text-right">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              
              {rows.length === 0 && (
                <tr>
                  <td className="px-6 py-20 text-center text-[rgb(var(--sub))]" colSpan={6}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>No results for this mode yet</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}