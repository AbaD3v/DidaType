"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Result = {
  id?: string;
  mode: "time" | "words";
  wpm: number;
  accuracy: number;
  errors: number;
  duration_ms: number;
  time_limit_sec?: number | null;
  words_count?: number | null;
  wpmSeries?: { t: number; wpm: number }[];
  accSeries?: { t: number; acc: number }[];
  errorSpikes?: number[];
  tokens?: string[];
  replay?: { t: number; v: string }[];
  words?: string[];
  wordlistLabel?: string;
  consistency?: number;
  correct_chars?: number;
  incorrect_chars?: number;
  total_chars?: number;
  created_at?: string;
};

export default function ResultsPage() {
  const [data, setData] = useState<Result | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("lastResult");
    if (raw) setData(JSON.parse(raw));
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen text-[rgb(var(--text))] bg-[rgb(var(--bg))] font-mono">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold">results</h1>
          <p className="text-[rgb(var(--sub))] mt-4">Нет результата. Пройди тест на главной.</p>
          <a href="/" className="inline-block mt-8 text-[rgb(var(--accent))] hover:underline">на главную</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))] font-mono">
      <div className="mx-auto w-full max-w-7xl px-8 py-12">
        <div className="text-[rgb(var(--sub))] text-sm tracking-[0.2em] uppercase opacity-50">didatype</div>
        <h1 className="text-4xl font-bold mt-2 mb-10">results</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 items-start">
          {/* LEFT STATS */}
          <aside className="space-y-10">
            <div className="group">
              <div className="text-[rgb(var(--sub))] uppercase tracking-widest text-xs mb-1">wpm</div>
              <div className="text-7xl font-black leading-none text-[rgb(var(--accent))] transition-transform group-hover:scale-105 origin-left">
                {data.wpm}
              </div>
            </div>

            <div className="group">
              <div className="text-[rgb(var(--sub))] uppercase tracking-widest text-xs mb-1">acc</div>
              <div className="text-6xl font-bold leading-none text-[rgb(var(--accent))] opacity-90 transition-transform group-hover:scale-105 origin-left">
                {data.accuracy}%
              </div>
            </div>

            <div className="pt-4 space-y-4 border-t border-[rgb(var(--sub))]/10">
              <Row label="test type" value={`${data.mode} ${data.mode === "time" ? data.time_limit_sec + "s" : data.words_count}`} />
              <Row label="language" value={data.wordlistLabel ?? "english"} />
              <Row label="characters" value={`${data.correct_chars ?? 0}/${data.incorrect_chars ?? 0}`} />
              <Row label="time" value={`${Math.round((data.duration_ms ?? 0) / 1000)}s`} />
            </div>

            <div className="pt-6 flex flex-col gap-3">
              <a href="/" className="flex items-center justify-center px-6 py-3 rounded-xl bg-[rgb(var(--sub))]/10 text-[rgb(var(--text))] hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--bg))] transition-all font-bold">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                restart test
              </a>
            </div>
          </aside>

          {/* RIGHT: GRAPHS */}
          <section className="min-w-0 space-y-8">
            <div className="rounded-2xl border border-[rgb(var(--sub))]/10 bg-black/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[rgb(var(--sub))] text-xs uppercase tracking-widest">performance history</div>
              </div>
              <WpmGraph
                series={data.wpmSeries ?? []}
                errorSpikes={data.errorSpikes ?? []}
                height={280}
              />
            </div>

            {data.replay?.length && data.tokens?.length ? (
              <div className="rounded-2xl border border-[rgb(var(--sub))]/10 bg-black/10 p-6">
                 <ReplayPlayer tokens={data.tokens} events={data.replay} />
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

// Вспомогательный компонент для строк статистики
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <div className="text-[rgb(var(--sub))] text-sm">{label}</div>
      <div className="text-[rgb(var(--text))] font-bold text-lg">{value}</div>
    </div>
  );
}

/* Примечание: Код WpmGraph и AccuracyGraph остается логически таким же, 
  но я рекомендую в WpmGraph заменить цвета линий на:
  ctx.strokeStyle = "rgba(226, 183, 20, 0.9)"; // Цвет акцента для плавной линии
  ctx.strokeStyle = "rgba(100, 102, 105, 0.4)"; // Цвет sub для сырой линии
*/

function WpmGraph({
  series,
  errorSpikes,
  height = 220,
}: {
  series: { t: number; wpm: number }[];
  errorSpikes: number[];
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const smoothed = useMemo(() => {
    const windowSize = 5; // 5 точек = мягко, можно 7
    const out: { t: number; wpm: number }[] = [];
    for (let i = 0; i < series.length; i++) {
      const from = Math.max(0, i - windowSize + 1);
      const slice = series.slice(from, i + 1);
      const avg = slice.reduce((a, p) => a + p.wpm, 0) / slice.length;
      out.push({ t: series[i].t, wpm: avg });
    }
    return out;
  }, [series]);

  const [tip, setTip] = useState<{
    x: number;
    y: number;
    t: number;
    raw: number;
    smooth: number;
  } | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const dpr = window.devicePixelRatio || 1;
    const width = c.clientWidth;
    const height = c.clientHeight;

    c.width = Math.floor(width * dpr);
    c.height = Math.floor(height * dpr);

    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // layout
    const padL = 38;
    const padR = 14;
    const padT = 12;
    const padB = 26;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const maxT = Math.max(1, ...series.map((p) => p.t));
    const maxW = Math.max(10, ...series.map((p) => p.wpm), ...smoothed.map((p) => p.wpm));

    const x = (t: number) => padL + (t / maxT) * plotW;
    const y = (w: number) => padT + (1 - w / maxW) * plotH;

    // clear
    ctx.clearRect(0, 0, width, height);

    // grid
    ctx.strokeStyle = "rgba(226, 183, 20, 0.9)"; // Цвет акцента для плавной линии
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yy = padT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(width - padR, yy);
      ctx.stroke();
    }

    // average line
    const avg = series.reduce((a, p) => a + p.wpm, 0) / Math.max(1, series.length);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const avgY = y(avg);
    ctx.beginPath();
    ctx.moveTo(padL, avgY);
    ctx.lineTo(width - padR, avgY);
    ctx.stroke();
    ctx.setLineDash([]);

    // error spikes (draw before lines so they sit beneath)
    if (errorSpikes && errorSpikes.length) {
      ctx.strokeStyle = "rgba(100, 102, 105, 0.4)"; // Цвет sub для сырой линии
      ctx.lineWidth = 1;
      for (const t of errorSpikes) {
        if (t < 0 || t > maxT) continue;
        const xx = x(t);
        ctx.beginPath();
        ctx.moveTo(xx, padT + plotH - 6);
        ctx.lineTo(xx, padT + plotH);
        ctx.stroke();
      }
    }

    // labels
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(`${Math.round(maxW)} wpm`, 8, padT + 10);
    ctx.fillText(`0`, 16, padT + plotH + 12);
    ctx.fillText(`${maxT}s`, padL + plotW - 24, padT + plotH + 18);

    // raw line (thin)
    if (series.length >= 2) {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x(series[0].t), y(series[0].wpm));
      for (let i = 1; i < series.length; i++) ctx.lineTo(x(series[i].t), y(series[i].wpm));
      ctx.stroke();
    }

    // smooth line (bold) with quadratic smoothing
    if (smoothed.length >= 2) {
      ctx.strokeStyle = "rgba(255,255,255,0.90)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x(smoothed[0].t), y(smoothed[0].wpm));
      for (let i = 1; i < smoothed.length; i++) {
        const prev = smoothed[i - 1];
        const curr = smoothed[i];
        const midX = (x(prev.t) + x(curr.t)) / 2;
        const midY = (y(prev.wpm) + y(curr.wpm)) / 2;
        ctx.quadraticCurveTo(x(prev.t), y(prev.wpm), midX, midY);
      }
      // ensure last segment ends at final point
      const last = smoothed[smoothed.length - 1];
      ctx.lineTo(x(last.t), y(last.wpm));
      ctx.stroke();
    }

    // points (for hover reference)
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (const p of smoothed) {
      ctx.beginPath();
      ctx.arc(x(p.t), y(p.wpm), 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // hover crosshair + highlighted point
    if (tip) {
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;

      // vertical line at hovered t
      ctx.beginPath();
      ctx.moveTo(tip.x, padT);
      ctx.lineTo(tip.x, padT + plotH);
      ctx.stroke();

      // highlighted circle on smooth line
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [series, smoothed, tip]);

  function onMove(e: React.MouseEvent) {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // canvas sizing matches wrap width; we reuse same paddings as draw
    const padL = 38;
    const padR = 14;
    const padT = 12;
    const padB = 26;

    const width = rect.width;
    const height = rect.height;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // outside plot -> hide tooltip
    if (mx < padL || mx > padL + plotW || my < padT || my > padT + plotH) {
      setTip(null);
      return;
    }

    const maxT = Math.max(1, ...series.map((p) => p.t));
    const maxW = Math.max(10, ...series.map((p) => p.wpm), ...smoothed.map((p) => p.wpm));

    // find nearest point by t based on x
    const tApprox = ((mx - padL) / plotW) * maxT;

    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < series.length; i++) {
      const d = Math.abs(series[i].t - tApprox);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    const t = series[bestIdx].t;
    const raw = series[bestIdx].wpm;
    const smooth = Math.round(smoothed[bestIdx]?.wpm ?? raw);

    const x = padL + (t / maxT) * plotW;
    const y = padT + (1 - (smoothed[bestIdx]?.wpm ?? raw) / maxW) * plotH;

    setTip({
      x,
      y,
      t,
      raw,
      smooth,
    });
  }

  function onLeave() {
    setTip(null);
  }

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      style={{ height }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <canvas ref={canvasRef} className="w-full h-full" />

      {tip ? (
        <div
          className="absolute px-3 py-2 rounded-lg border border-white/10 bg-black/80 text-xs text-white/90"
          style={{
            left: Math.min(tip.x + 12, (wrapRef.current?.clientWidth ?? 0) - 150),
            top: Math.max(8, tip.y - 42),
            pointerEvents: "none",
            width: 140,
          }}
        >
          <div className="text-white/70">{tip.t}s</div>
          <div className="mt-1">
            <span className="text-white/60">smooth</span>{" "}
            <span className="font-semibold">{tip.smooth}</span>
          </div>
          <div>
            <span className="text-white/60">raw</span>{" "}
            <span className="font-semibold">{tip.raw}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AccuracyGraph({
  series,
  errorSpikes,
  height = 220,
}: {
  series: { t: number; acc: number }[];
  errorSpikes: number[];
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; t: number; acc: number } | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    const wrap = wrapRef.current;
    if (!c || !wrap) return;

    const dpr = window.devicePixelRatio || 1;
    const width = c.clientWidth;
    const height = c.clientHeight;

    c.width = Math.floor(width * dpr);
    c.height = Math.floor(height * dpr);

    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padL = 38;
    const padR = 14;
    const padT = 12;
    const padB = 26;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const maxT = Math.max(1, ...series.map((p) => p.t));

    const x = (t: number) => padL + (t / maxT) * plotW;
    const y = (a: number) => padT + (1 - a / 100) * plotH;

    ctx.clearRect(0, 0, width, height);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yy = padT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(width - padR, yy);
      ctx.stroke();
    }

    // labels
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText("100%", 8, padT + 10);
    ctx.fillText("0%", 16, padT + plotH + 12);
    ctx.fillText(`${maxT}s`, padL + plotW - 24, padT + plotH + 18);

    // error spikes
    ctx.strokeStyle = "rgba(248,113,113,0.55)";
    ctx.lineWidth = 1;
    for (const t of errorSpikes) {
      if (t < 0 || t > maxT) continue;
      const xx = x(t);
      ctx.beginPath();
      ctx.moveTo(xx, padT + plotH - 6);
      ctx.lineTo(xx, padT + plotH);
      ctx.stroke();
    }

    // line
    if (series.length >= 2) {
      ctx.strokeStyle = "rgba(255,255,255,0.90)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x(series[0].t), y(series[0].acc));
      for (let i = 1; i < series.length; i++) ctx.lineTo(x(series[i].t), y(series[i].acc));
      ctx.stroke();
    }

    // points
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (const p of series) {
      ctx.beginPath();
      ctx.arc(x(p.t), y(p.acc), 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // hover crosshair
    if (tip) {
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tip.x, padT);
      ctx.lineTo(tip.x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [series, errorSpikes, tip]);

  function onMove(e: React.MouseEvent) {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const padL = 38;
    const padR = 14;
    const padT = 12;
    const padB = 26;

    const width = rect.width;
    const height = rect.height;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    if (mx < padL || mx > padL + plotW || my < padT || my > padT + plotH) {
      setTip(null);
      return;
    }

    const maxT = Math.max(1, ...series.map((p) => p.t));
    const tApprox = ((mx - padL) / plotW) * maxT;

    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < series.length; i++) {
      const d = Math.abs(series[i].t - tApprox);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    const p = series[bestIdx];
    const x = padL + (p.t / maxT) * plotW;
    const y = padT + (1 - p.acc / 100) * plotH;

    setTip({ x, y, t: p.t, acc: p.acc });
  }

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      style={{ height }}
      onMouseMove={onMove}
      onMouseLeave={() => setTip(null)}
    >
      <canvas ref={canvasRef} className="w-full h-full" />

      {tip ? (
        <div
          className="absolute px-3 py-2 rounded-lg border border-white/10 bg-black/80 text-xs text-white/90"
          style={{
            left: Math.min(tip.x + 12, (wrapRef.current?.clientWidth ?? 0) - 150),
            top: Math.max(8, tip.y - 42),
            pointerEvents: "none",
            width: 140,
          }}
        >
          <div className="text-white/70">{tip.t}s</div>
          <div className="mt-1">
            <span className="text-white/60">acc</span>{" "}
            <span className="font-semibold">{tip.acc}%</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReplayPlayer({
  tokens,
  events,
}: {
  tokens: string[];
  events: { t: number; v: string }[];
}) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const safeEvents = useMemo(() => {
    return [...events].sort((a, b) => a.t - b.t);
  }, [events]);

  useEffect(() => {
    for (let i = 1; i < events.length; i++) {
      if (events[i].t < events[i - 1].t) {
        // eslint-disable-next-line no-console
        console.log("BAD T ORDER at", i, events[i - 1], events[i]);
        break;
      }
    }
  }, [events]);

  const [value, setValue] = useState(safeEvents[0]?.v ?? "");
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const baseTRef = useRef<number>(0);

  // space-aware cursor: activeIndex counts by space-separated words; typedActive is last word without trailing space
  const cursor = useMemo(() => {
    // нормализуем пробелы, но НЕ убираем их полностью
    const normalized = value.replace(/\s+/g, " ");

    // если строка пустая
    const trimmedLeft = normalized.trimStart();
    if (!trimmedLeft) return { activeIndex: 0, typedActive: "" };

    const endsWithSpace = /\s$/.test(normalized);

    // слова, которые реально разделены пробелами
    const parts = trimmedLeft.split(" ");

    // activeIndex:
    // - если в конце пробел → текущее слово завершено, активное = следующее
    // - иначе активное = последнее (то, что сейчас набирается)
    const activeIndex = Math.min(
      endsWithSpace ? parts.length : parts.length - 1,
      tokens.length - 1
    );

    // typedActive:
    // - если в конце пробел → мы уже на следующем слове, там пока пусто
    // - иначе берём последнее слово как “набираемое”
    const typedActive = endsWithSpace ? "" : (parts[parts.length - 1] ?? "");

    return { activeIndex: Math.max(0, activeIndex), typedActive };
  }, [value, tokens.length]);

  const wordIndex = cursor.activeIndex;

  // ВАЖНО: чтобы лишний символ не ломал отрисовку (и не “переливал” в следующее слово)
  const currentTypedWord = useMemo(() => {
    const maxLen = tokens[wordIndex]?.length ?? 0;
    return cursor.typedActive.slice(0, maxLen);
  }, [cursor.typedActive, tokens, wordIndex]);

  function stop() {
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function reset() {
    stop();
    setPos(0);
    setValue(safeEvents[0]?.v ?? "");
  }

  function play() {
    if (safeEvents.length < 2) return;
    setPlaying(true);

    const now = performance.now();
    startRef.current = now;
    baseTRef.current = safeEvents[pos]?.t ?? 0;

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const targetT = baseTRef.current + elapsed;

      let i = pos;
      while (i + 1 < safeEvents.length && safeEvents[i + 1].t <= targetT) i++;

      if (i !== pos) {
        setPos(i);
        setValue(safeEvents[i].v);
      }

      if (i >= events.length - 1) {
        setPlaying(false);
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    if (playing) play();
    else stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-white/70 text-sm">replay</div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="px-3 py-1 rounded bg-white text-black hover:opacity-90 text-sm"
          >
            {playing ? "pause" : "play"}
          </button>

          <button
            type="button"
            onClick={reset}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm"
          >
            reset
          </button>
        </div>
      </div>

      <div className="mt-4 text-white/60 text-sm">
        t: {safeEvents[pos]?.t ?? 0}ms · word: {wordIndex + 1}/{tokens.length}
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4">
        <ReplayWords tokens={tokens} activeIndex={wordIndex} typedActive={currentTypedWord} fullValue={value} />
      </div>
    </div>
  );
}

    function ReplayWords({
      tokens,
      activeIndex,
      typedActive,
      fullValue,
    }: {
      tokens: string[];
      activeIndex: number;
      typedActive: string;
      fullValue?: string;
    }) {
      return (
        <div className="leading-8 text-lg select-none">
            {tokens.map((w, i) => {
            const isActive = i === activeIndex;
            const isDone = i < activeIndex;

            return (
              <span key={i} className="inline-block mr-2 mb-2 px-1 rounded relative">
                {w.split("").map((ch, idx) => {
                  let cls = "text-white/35";

                  if (isDone) cls = "text-white/70";

                  if (isActive && idx < typedActive.length) {
                    cls = typedActive[idx] === ch ? "text-white" : "text-red-400";
                  }
                  return (
                    <span key={idx} className={cls}>
                      {ch}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </div>
      );
    }