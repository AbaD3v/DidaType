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
  const [who, setWho] = useState<string>("loading...");

  const stats = useMemo(() => {
    if (rows.length === 0) return null;
    const best = Math.max(...rows.map(r => r.wpm));
    const avg = Math.round(rows.reduce((a, r) => a + r.wpm, 0) / rows.length);
    const avgAcc = Math.round(rows.reduce((a, r) => a + r.accuracy, 0) / rows.length);
    return { best, avg, avgAcc, total: rows.length };
  }, [rows]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      const sessionKey = "didatype_session_id";
      const sessionId = typeof window !== "undefined" ? localStorage.getItem(sessionKey) : null;

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
        setWho("local guest session");
      } else {
        setWho("no data found");
        setRows([]);
        return;
      }

      const { data } = await q;
      setRows((data as Row[]) ?? []);
    })();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))] font-mono">
      <div className="max-w-5xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-[rgb(var(--sub))] text-sm tracking-[0.3em] uppercase opacity-50 mb-1">account</div>
            <h1 className="text-4xl font-black tracking-tight">my stats</h1>
            <p className="text-[rgb(var(--accent))] mt-2 font-bold opacity-80">{who}</p>
          </div>
          
          <div className="flex gap-3">
            <a href="/" className="px-5 py-2 rounded-xl bg-[rgb(var(--sub))]/10 hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--bg))] transition-all font-bold text-sm">
              new test
            </a>
            <a href="/leaderboard" className="px-5 py-2 rounded-xl bg-[rgb(var(--sub))]/5 border border-[rgb(var(--sub))]/10 hover:border-[rgb(var(--sub))]/30 transition-all text-sm">
              leaderboard
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-12">
          <StatCard title="best wpm" value={stats?.best} highlight />
          <StatCard title="average wpm" value={stats?.avg} />
          <StatCard title="avg accuracy" value={stats ? `${stats.avgAcc}%` : null} />
          <StatCard title="tests taken" value={stats?.total} />
        </div>

        {/* History Table */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[rgb(var(--sub))]">history</h2>
          <span className="text-xs text-[rgb(var(--sub))] opacity-50 uppercase tracking-widest">showing last 50 runs</span>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--sub))]/10 bg-black/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[rgb(var(--sub))]/5 text-[rgb(var(--sub))] text-xs uppercase tracking-widest">
                <th className="px-6 py-4 font-medium">date</th>
                <th className="px-6 py-4 font-medium">mode</th>
                <th className="px-6 py-4 font-medium text-[rgb(var(--accent))]">wpm</th>
                <th className="px-6 py-4 font-medium">acc</th>
                <th className="px-6 py-4 font-medium">err</th>
                <th className="px-6 py-4 font-medium text-right">duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--sub))]/5">
              {rows.slice(0, 50).map((r) => (
                <tr key={r.id} className="hover:bg-[rgb(var(--sub))]/5 transition-colors group">
                  <td className="px-6 py-4 text-[rgb(var(--sub))] text-sm">
                    {new Date(r.created_at).toLocaleDateString()} <span className="opacity-40 ml-1">{new Date(r.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[rgb(var(--sub))] font-medium">
                    {r.mode === "time" ? `time ${r.time_limit_sec}s` : `words ${r.words_count}`}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xl font-bold text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent))] transition-colors">{r.wpm}</span>
                  </td>
                  <td className="px-6 py-4 font-medium">{r.accuracy}%</td>
                  <td className="px-6 py-4 text-[rgb(var(--error))] opacity-70">{r.errors}</td>
                  <td className="px-6 py-4 text-[rgb(var(--sub))] text-right text-sm italic">
                    {(r.duration_ms / 1000).toFixed(1)}s
                  </td>
                </tr>
              ))}
              
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <p className="text-[rgb(var(--sub))] italic">No results found in your current session.</p>
                    <a href="/" className="inline-block mt-4 text-[rgb(var(--accent))] hover:underline font-bold">Start typing now →</a>
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

function StatCard({ title, value, highlight = false }: { title: string; value: string | number | null | undefined, highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-6 border transition-all duration-300 ${
      highlight 
        ? "border-[rgb(var(--accent))]/30 bg-[rgb(var(--accent))]/5 shadow-lg shadow-[rgb(var(--accent))]/5" 
        : "border-[rgb(var(--sub))]/10 bg-black/10"
    }`}>
      <div className="text-[rgb(var(--sub))] text-xs uppercase tracking-[0.2em] mb-2 font-medium">{title}</div>
      <div className={`text-4xl font-black ${highlight ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--text))]"}`}>
        {value ?? "-"}
      </div>
    </div>
  );
}