"use client";

import { useEffect, useState } from "react";

type Result = {
  id?: string;
  mode: "time" | "words";
  wpm: number;
  accuracy: number;
  errors: number;
  duration_ms: number;
  time_limit_sec?: number | null;
  words_count?: number | null;
  created_at?: string;
};

export default function ResultsPage() {
  const [data, setData] = useState<Result | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("lastResult");
    if (raw) setData(JSON.parse(raw));
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen text-white bg-neutral-950">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-semibold">results</h1>
          <p className="text-white/60 mt-3">Нет результата. Пройди тест на главной.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white bg-neutral-950">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-[rgb(var(--accent))] text-sm tracking-widest uppercase">didatype</div>
        <h1 className="text-3xl font-semibold mt-1">results</h1>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="text-4xl font-semibold">{data.wpm} WPM</div>
          <div className="mt-2 text-white/70">
            {data.accuracy}% accuracy · {data.errors} errors · {(data.duration_ms / 1000).toFixed(1)}s · mode:{" "}
            {data.mode}
          </div>

          <div className="mt-4 text-white/60 text-sm">
            {data.mode === "time" ? (
              <>time limit: {data.time_limit_sec ?? "-"}s</>
            ) : (
              <>words: {data.words_count ?? "-"}</>
            )}
          </div>

          {data.id ? (
            <div className="mt-4 text-white/60 text-sm">
              result id: <span className="text-white/80">{data.id}</span>
            </div>
          ) : null}
        </div>

        <a
          href="/"
          className="inline-block mt-8 px-4 py-2 rounded bg-white text-black hover:opacity-90"
        >
          Back to test
        </a>
      </div>
    </main>
  );
}