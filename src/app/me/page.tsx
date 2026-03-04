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
  duration_ms: number;
};

export default function MePage() {
  const supabase = createSupabaseBrowser();
  const [rows, setRows] = useState<Row[]>([]);
  const [who, setWho] = useState<string>("");

  const stats = useMemo(() => {
    if (rows.length === 0) return null;
    const best = Math.max(...rows.map(r => r.wpm));
    const avg = Math.round(rows.reduce((a, r) => a + r.wpm, 0) / rows.length);
    const avgAcc = Math.round(rows.reduce((a, r) => a + r.accuracy, 0) / rows.length);
    return { best, avg, avgAcc, total: rows.length };
  }, [rows]);

  useEffect(() => {
    (async () => {
      // 1) пробуем user_id
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      // 2) если нет — берём session_id (anon)
      const sessionKey = "didatype_session_id";
      const sessionId = localStorage.getItem(sessionKey);

      let q = supabase
        .from("typing_results")
        .select("id,wpm,accuracy,errors,created_at,mode,time_limit_sec,words_count,duration_ms")
        .order("created_at", { ascending: false })
        .limit(200);

      if (userId) {
        q = q.eq("user_id", userId);
        setWho(auth.user?.email ?? "signed-in user");
      } else if (sessionId) {
        q = q.eq("session_id", sessionId);
        setWho("anon session");
      } else {
        setWho("no session yet");
        setRows([]);
        return;
      }

      const { data } = await q;
      setRows((data as Row[]) ?? []);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-[rgb(var(--accent))] text-sm tracking-widest uppercase">didatype</div>
        <h1 className="text-3xl font-semibold mt-1">my stats</h1>
        <p className="text-white/60 mt-2">{who}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <Card title="best wpm" value={stats ? String(stats.best) : "-"} />
          <Card title="avg wpm" value={stats ? String(stats.avg) : "-"} />
          <Card title="avg acc" value={stats ? `${stats.avgAcc}%` : "-"} />
          <Card title="tests" value={stats ? String(stats.total) : "0"} />
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-white/10 text-white/60 text-sm">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">WPM</th>
                <th className="px-4 py-3">Acc</th>
                <th className="px-4 py-3">Err</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white/70">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {r.mode === "time"
                      ? `time ${r.time_limit_sec ?? "-"}s`
                      : `words ${r.words_count ?? "-"}`}
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.wpm}</td>
                  <td className="px-4 py-3">{r.accuracy}%</td>
                  <td className="px-4 py-3">{r.errors}</td>
                  <td className="px-4 py-3 text-white/70">{(r.duration_ms / 1000).toFixed(1)}s</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-white/60">
                    No results yet. Do a test first.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex gap-3">
          <a href="/" className="px-4 py-2 rounded bg-white text-black hover:opacity-90">
            back to test
          </a>
          <a href="/leaderboard" className="px-4 py-2 rounded bg-white/10 hover:bg-white/15">
            leaderboard
          </a>
        </div>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="text-white/60 text-sm">{title}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}