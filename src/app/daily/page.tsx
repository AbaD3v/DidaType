"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/hooks/utils/supabase/client";
import TypingTest from "@/components/TypingTest";
import { WordlistKey } from "@/lib/wordlists";

type DailyRow = {
  id: string;
  wpm: number;
  accuracy: number;
  errors: number;
  created_at: string;
  username?: string | null;
};

function todayYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DailyPage() {
  const supabase = createSupabaseBrowser();
  const day = useMemo(() => todayYYYYMMDD(), []);
  const [rows, setRows] = useState<DailyRow[]>([]);

  const dailyCfg = useMemo(() => {
    return {
      mode: "time" as const,
      timeLimitSec: 30,
      wordsCount: 25,
      count: 260,
      wordlist: "en200" as WordlistKey,
      punctuation: true,
      numbers: true,
    };
  }, []);

  useEffect(() => {
    (async () => {
      // Предполагаем, что у тебя есть view или join для получения username, 
      // как в обычном лидерборде
      const { data } = await supabase
        .from("daily_results") 
        .select("id,wpm,accuracy,errors,created_at")
        .eq("day", day)
        .order("wpm", { ascending: false })
        .limit(30);

      setRows((data as DailyRow[]) ?? []);
    })();
  }, [day, supabase]);

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))] font-mono">
      <div className="max-w-5xl mx-auto px-8 py-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-2 py-0.5 rounded bg-[rgb(var(--accent))] text-[rgb(var(--bg))] text-[10px] font-black uppercase tracking-tighter">
                Daily
              </div>
              <div className="text-[rgb(var(--sub))] text-sm tracking-[0.3em] uppercase opacity-50">
                Challenge
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-tight leading-none">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </h1>
            <p className="text-[rgb(var(--sub))] mt-3 text-sm flex items-center gap-2">
              <span className="text-[rgb(var(--accent))] font-bold">30s</span> 
              <span className="opacity-30">•</span> 
              <span>punctuation</span> 
              <span className="opacity-30">•</span> 
              <span>numbers</span>
            </p>
          </div>

          <div className="flex gap-3">
            <a href="/" className="px-5 py-2 rounded-xl bg-[rgb(var(--sub))]/10 hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--bg))] transition-all font-bold text-sm">
              practice
            </a>
            <a href="/leaderboard" className="px-5 py-2 rounded-xl bg-[rgb(var(--sub))]/5 border border-[rgb(var(--sub))]/10 hover:border-[rgb(var(--sub))]/30 transition-all text-sm">
              all-time
            </a>
          </div>
        </div>

        {/* The Test Section */}
        <div className="relative group">
           {/* Декоративный эффект вокруг теста */}
          <div className="absolute -inset-4 bg-gradient-to-b from-[rgb(var(--accent))]/5 to-transparent rounded-[2rem] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <TypingTest
            daily={{
              day,
              ...dailyCfg,
            }}
          />
        </div>

        {/* Daily Leaderboard */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black flex items-center gap-2">
              <svg className="w-5 h-5 text-[rgb(var(--accent))]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM11 2a1 1 0 011-1h1v1a1 1 0 110 2h-1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 10a1 1 0 011-1h1v1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              today's ranking
            </h2>
            <div className="text-[rgb(var(--sub))] text-xs uppercase tracking-widest opacity-50">
              top players today
            </div>
          </div>

          <div className="rounded-2xl border border-[rgb(var(--sub))]/10 bg-black/5 overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[rgb(var(--sub))]/5 text-[rgb(var(--sub))] text-xs uppercase tracking-widest">
                  <th className="px-6 py-4 font-medium w-16">#</th>
                  <th className="px-6 py-4 font-medium text-[rgb(var(--accent))]">wpm</th>
                  <th className="px-6 py-4 font-medium">accuracy</th>
                  <th className="px-6 py-4 font-medium">errors</th>
                  <th className="px-6 py-4 font-medium text-right">time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--sub))]/5">
                {rows.map((r, i) => (
                  <tr key={r.id} className="hover:bg-[rgb(var(--accent))]/5 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${i < 3 ? 'text-[rgb(var(--accent))]' : 'text-[rgb(var(--sub))]'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-2xl font-black text-[rgb(var(--text))]">{r.wpm}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">{r.accuracy}%</td>
                    <td className="px-6 py-4 text-[rgb(var(--error))] opacity-70">{r.errors}</td>
                    <td className="px-6 py-4 text-[rgb(var(--sub))] text-right text-sm">
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                
                {rows.length === 0 && (
                  <tr>
                    <td className="px-6 py-16 text-center text-[rgb(var(--sub))]" colSpan={5}>
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-[rgb(var(--sub))]/30 flex items-center justify-center animate-pulse">
                          <span className="text-[rgb(var(--accent))]">!</span>
                        </div>
                        <p className="italic">The leaderboard is empty. Be the first to set a record today!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}