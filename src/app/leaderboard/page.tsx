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

      // базовый античит: не показываем абсурдные значения
      q = q.lte("wpm", 250).gte("accuracy", 0).lte("accuracy", 100);

      const { data } = await q;
      setRows((data as Row[]) ?? []);
    })();
  }, [mode, timeLimit, wordsCount]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[rgb(var(--accent))] text-sm tracking-widest uppercase">didatype</div>
            <h1 className="text-3xl font-semibold mt-1">leaderboard</h1>
            <p className="text-white/60 mt-2">{title}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a href="/profile" className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm">
              profile
            </a>
            <a href="/" className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm">
              test
            </a>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-[rgb(var(--muted))] text-sm mr-2">mode</span>

          <button
            type="button"
            onClick={() => setMode("time")}
            className={mode === "time" ? "px-3 py-1 rounded bg-white text-black text-sm" : "px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm"}
          >
            time
          </button>
          <button
            type="button"
            onClick={() => setMode("words")}
            className={mode === "words" ? "px-3 py-1 rounded bg-white text-black text-sm" : "px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm"}
          >
            words
          </button>

          <div className="w-px h-6 bg-white/10 mx-2" />

          {mode === "time" ? (
            [15, 30, 60].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTimeLimit(s)}
                className={timeLimit === s ? "px-3 py-1 rounded bg-white text-black text-sm" : "px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm"}
              >
                {s}s
              </button>
            ))
          ) : (
            [10, 25, 50].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setWordsCount(n)}
                className={wordsCount === n ? "px-3 py-1 rounded bg-white text-black text-sm" : "px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm"}
              >
                {n}
              </button>
            ))
          )}
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-white/10 text-white/60 text-sm">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">WPM</th>
                <th className="px-4 py-3">Acc</th>
                <th className="px-4 py-3">Err</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white/60">{i + 1}</td>
                  <td className="px-4 py-3">
                    {r.username ? (
                      <span className="text-white/90">{r.username}</span>
                    ) : (
                      <span className="text-white/50">anon</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.wpm}</td>
                  <td className="px-4 py-3">{r.accuracy}%</td>
                  <td className="px-4 py-3">{r.errors}</td>
                  <td className="px-4 py-3 text-white/60">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-white/60" colSpan={6}>
                    No results yet — do a test and come back.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}