// src/components/TypingTest.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { TestMode, TypingState, calcAccuracy, calcWpm } from "@/lib/typing";
import { generateDailyTokens } from "@/lib/daily";
import CaretStyleBar from "@/components/CaretStyleBar";
import { WORDLISTS, WordlistKey } from "@/lib/wordlists";
import { generateTokens } from "@/lib/textgen";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/hooks/utils/supabase/client";

const WORD_POOL = [
  "react","next","typescript","tailwind","supabase","project","student","rent",
  "keyboard","speed","focus","practice","random","modern","design","client",
  "server","route","component","state","effect","accuracy","error","progress",
  "future","simple","clean","fast","build","launch","product","startup"
];

type DailyProps = {
  day: string;
  wordlist: WordlistKey;
  count: number;
  punctuation: boolean;
  numbers: boolean;
  mode: "time" | "words";
  timeLimitSec?: number;
  wordsCount?: number;
};

type Props = {
  mode?: TestMode;
  timeLimitSec?: number;
  wordsCount?: number;
  daily?: DailyProps;
};

function now() {
  return Date.now();
}

export default function TypingTest({
  mode = "time",
  timeLimitSec = 30,
  wordsCount = 25,
  daily,
}: Props) {
  const [testMode, setTestMode] = useState<TestMode>(mode);
  const [timeLimit, setTimeLimit] = useState(timeLimitSec);
  const [countWords, setCountWords] = useState(wordsCount);

  const [words, setWords] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<TypingState>(() => ({
    words: [],
    wordIndex: 0,
    charIndex: 0,
    typedChars: 0,
    correctChars: 0,
    errors: 0,
    startedAt: null,
    endedAt: null,
  }));
  const [caretStyle, setCaretStyle] = useState<"line" | "block" | "underline">("line");
  const caretRef = useRef<HTMLDivElement | null>(null);
  const caretAnchorRef = useRef<HTMLSpanElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const savedOnceRef = useRef(false);
  const [wordlist, setWordlist] = useState<WordlistKey>("en200");
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  type WpmPoint = { t: number; wpm: number };
  type AccPoint = { t: number; acc: number };
  const [wpmSeries, setWpmSeries] = useState<WpmPoint[]>([]);
  const [accSeries, setAccSeries] = useState<AccPoint[]>([]);
  const [errorSpikes, setErrorSpikes] = useState<number[]>([]);
  const lastErrorsRef = useRef(0);
  type ReplayEvent = { t: number; v: string };
  const [replay, setReplay] = useState<ReplayEvent[]>([]);
  const wpmTimerRef = useRef<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(timeLimit * 1000);

  useEffect(() => {
    if (!daily) return;

    setTestMode(daily.mode as TestMode);
    if (daily.mode === "time" && daily.timeLimitSec) setTimeLimit(daily.timeLimitSec);
    if (daily.mode === "words" && daily.wordsCount) setCountWords(daily.wordsCount);

    setWordlist(daily.wordlist);
    setPunctuation(daily.punctuation);
    setNumbers(daily.numbers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daily?.day]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeWord = words[state.wordIndex] ?? "";
  const isFinished = state.endedAt !== null;

  const elapsedMs = useMemo(() => {
    if (!state.startedAt) return 0;
    const end = state.endedAt ?? now();
    return Math.max(0, end - state.startedAt);
  }, [state.startedAt, state.endedAt]);

  const wpm = useMemo(() => calcWpm(state.correctChars, elapsedMs), [state.correctChars, elapsedMs]);
  const acc = useMemo(() => calcAccuracy(state.correctChars, state.typedChars), [state.correctChars, state.typedChars]);

  function reset() {
    const needed = testMode === "words" ? countWords : 260;

    const picked = daily
      ? generateDailyTokens({
          day: daily.day,
          wordlist: daily.wordlist,
          count: daily.count,
          punctuation: daily.punctuation,
          numbers: daily.numbers,
          mode: daily.mode,
          timeLimitSec: daily.timeLimitSec,
          wordsCount: daily.wordsCount,
        })
      : generateTokens({
          wordlist,
          count: needed,
          punctuation,
          numbers,
        });
    setWords(picked);
    setInput("");
    setRemainingMs(timeLimit * 1000);
    setWpmSeries([]);
    setAccSeries([]);
    setErrorSpikes([]);
    setReplay([]);
    if (wpmTimerRef.current) window.clearInterval(wpmTimerRef.current);
    wpmTimerRef.current = null;
    savedOnceRef.current = false;
    lastErrorsRef.current = 0;
    setState({
      words: picked,
      wordIndex: 0,
      charIndex: 0,
      typedChars: 0,
      correctChars: 0,
      errors: 0,
      startedAt: null,
      endedAt: null,
    });
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      updateCaretPosition();
    });
  }

  useEffect(() => {
    if (!state.startedAt) return;
    setReplay([{ t: 0, v: "" }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.startedAt]);

  function pushReplayValue(nextValue: string) {
    if (!state.startedAt || state.endedAt) return;
    const t = Date.now() - state.startedAt;

    setReplay((prev) => {
      if (prev.length && prev[prev.length - 1].v === nextValue) return prev;
      if (prev.length && t - prev[prev.length - 1].t < 25) return prev;
      return [...prev, { t, v: nextValue }];
    });
  }

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testMode, timeLimit, countWords, wordlist, punctuation, numbers, daily?.day]);

  useEffect(() => {
    if (testMode !== "time") return;
    if (!state.startedAt || isFinished) return;

    const id = window.setInterval(() => {
      const left = Math.max(0, timeLimit * 1000 - (now() - (state.startedAt ?? now())));
      setRemainingMs(left);

      if (left <= 0) {
        setState((s) => (s.endedAt ? s : { ...s, endedAt: now() }));
        window.clearInterval(id);
      }
    }, 50);

    return () => window.clearInterval(id);
  }, [testMode, timeLimit, state.startedAt, isFinished]);

  function startIfNeeded() {
    setState((s) => (s.startedAt ? s : { ...s, startedAt: now() }));
  }

  function finishIfWordsDone(nextWordIndex: number) {
    if (testMode !== "words") return;
    if (nextWordIndex >= countWords) {
      setState((s) => (s.endedAt ? s : { ...s, endedAt: now() }));
    }
  }

  useEffect(() => {
    const saved = (localStorage.getItem("caretStyle") as any) ?? "line";
    if (saved === "line" || saved === "block" || saved === "underline") setCaretStyle(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("wordlist") as WordlistKey | null;
    if (saved && WORDLISTS[saved]) setWordlist(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPunctuation(localStorage.getItem("punctuation") === "1");
    setNumbers(localStorage.getItem("numbers") === "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("caretStyle", caretStyle);
  }, [caretStyle]);

  function updateCaretPosition() {
    const caret = caretRef.current;
    const anchor = caretAnchorRef.current;
    if (!caret || !anchor) return;

    const container = caret.parentElement;
    if (!container) return;

    const a = anchor.getBoundingClientRect();
    const c = container.getBoundingClientRect();

    const x = a.left - c.left;
    const y = a.top - c.top;

    caret.style.transform = `translate(${x}px, ${y}px)`;
  }

  async function saveResultToSupabase(payload: any) {
    const sessionKey = "didatype_session_id";
    let sessionId = localStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(sessionKey, sessionId);
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;

    const { data, error } = await supabase
      .from("typing_results")
      .insert({
        user_id: userId,
        session_id: sessionId,
        ...payload,
      })
      .select("id, created_at")
      .single();
    if (error) {
      console.error("Supabase insert error:", JSON.stringify(error, null, 2));
      throw error;
    }
    return data;
  }

  async function saveDailyResultToSupabase(day: string, payload: any) {
    const sessionKey = "didatype_session_id";
    let sessionId = localStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(sessionKey, sessionId);
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;

    const { data, error } = await supabase
      .from("daily_results")
      .insert({
        day,
        user_id: userId,
        session_id: sessionId,
        ...payload,
      })
      .select("id, created_at")
      .single();
    if (error) {
      console.error("Supabase insert error:", JSON.stringify(error, null, 2));
      throw error;
    }
    return data;
  }

  function scoreChar(typed: string, expected: string) {
    if (typed === expected) return { correct: 1, error: 0 };
    return { correct: 0, error: 1 };
  }

  useEffect(() => {
    requestAnimationFrame(updateCaretPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, state.wordIndex, words]);

  useEffect(() => {
    if (!state.startedAt || state.endedAt || wpmTimerRef.current) return;

    wpmTimerRef.current = window.setInterval(() => {
      setWpmSeries((prev) => {
        if (state.correctChars === 0) return prev;
        const elapsedMsNow = Date.now() - state.startedAt!;
        const t = Math.max(0, Math.floor(elapsedMsNow / 1000));
        const minutes = Math.max(0.001, elapsedMsNow / 60000);
        const wpmNow = Math.round((state.correctChars / 5) / minutes);
        if (prev.length && prev[prev.length - 1].t === t) return prev;
        return [...prev, { t, wpm: Math.max(0, wpmNow) }];
      });

      setAccSeries((prev) => {
        const elapsedMsNow = Date.now() - state.startedAt!;
        const t = Math.max(0, Math.floor(elapsedMsNow / 1000));
        const total = state.typedChars ?? state.correctChars + state.errors;
        const accNow = total > 0 ? Math.round((state.correctChars / total) * 100) : 100;
        if (prev.length && prev[prev.length - 1].t === t) return prev;
        return [...prev, { t, acc: Math.max(0, Math.min(100, accNow)) }];
      });
    }, 1000);

    return () => {
      if (wpmTimerRef.current) window.clearInterval(wpmTimerRef.current);
      wpmTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.startedAt, state.endedAt, state.correctChars]);

  useEffect(() => {
    const sc = scrollRef.current;
    const el = activeWordRef.current;
    if (!sc || !el) return;

    const scRect = sc.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const elTopInScroll = (elRect.top - scRect.top) + sc.scrollTop;
    const focusRatio = 0.42; 
    const focusOffset = sc.clientHeight * focusRatio;
    const target = Math.max(0, elTopInScroll - focusOffset);
    
    sc.scrollTo({ top: target, behavior: "smooth" });
  }, [state.wordIndex]);

  useEffect(() => {
    if (!state.startedAt || state.endedAt) return;
    const prev = lastErrorsRef.current;
    if (state.errors > prev) {
      const t = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
      setErrorSpikes((arr) => {
        if (arr.length && arr[arr.length - 1] === t) return arr;
        return [...arr, t];
      });
    }
    lastErrorsRef.current = state.errors;
  }, [state.errors, state.startedAt, state.endedAt]);

  useEffect(() => {
    if (!isFinished || !state.startedAt || !state.endedAt || savedOnceRef.current) return;
    savedOnceRef.current = true;

    // 1) то, что реально есть в таблице Supabase
    const dbPayload = {
      mode: testMode,
      wpm,
      accuracy: acc,
      errors: state.errors,
      duration_ms: elapsedMs,
      time_limit_sec: testMode === "time" ? timeLimit : null,
      words_count: testMode === "words" ? countWords : null,
    };

    // 2) то, что нужно для /results (графики/реплей)
    const clientPayload = {
      ...dbPayload,
      wpmSeries,
      accSeries,
      errorSpikes,
      replay,
      tokens: words,
      correct_chars: state.correctChars,
      incorrect_chars: state.errors,
      total_chars: state.typedChars,
      wordlistLabel: WORDLISTS[wordlist]?.label ?? "english",
    };

    (async () => {
      try {
        let saved: any;

        if (daily) {
          saved = await saveDailyResultToSupabase(daily.day, dbPayload);
        } else {
          saved = await saveResultToSupabase(dbPayload);
        }

        const resultData = {
          ...clientPayload,
          ...saved,
          day: daily?.day ?? null,
        };

        localStorage.setItem("lastResult", JSON.stringify(resultData));
        router.push("/results");
      } catch (e) {
        console.error("save result error:", JSON.stringify(e, null, 2));

        const fallback = {
          ...clientPayload,
          day: daily?.day ?? null,
        };

        localStorage.setItem("lastResult", JSON.stringify(fallback));
        router.push("/results");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  function commitWord(wordTyped: string) {
    const expected = activeWord;
    const maxLen = Math.max(wordTyped.length, expected.length);
    let correct = 0;
    let errors = 0;

    for (let i = 0; i < maxLen; i++) {
      const r = scoreChar(wordTyped[i] ?? "", expected[i] ?? "");
      correct += r.correct;
      errors += r.error;
    }

    setState((s) => ({
      ...s,
      wordIndex: s.wordIndex + 1,
      charIndex: 0,
      typedChars: s.typedChars + wordTyped.length + 1,
      correctChars: s.correctChars + correct,
      errors: s.errors + errors,
    }));

    setInput("");
    requestAnimationFrame(updateCaretPosition);
    finishIfWordsDone(state.wordIndex + 1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isFinished) return;

    if (e.key.length === 1 || e.key === "Backspace" || e.key === " ") {
      startIfNeeded();
    }

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      commitWord(input);
      return;
    }
  }

  function renderWord(word: string, index: number) {
    const isActive = index === state.wordIndex;
    const typed = isActive ? input : "";
    const caretPos = Math.min(typed.length, word.length);

    return (
      <span
        key={index}
        ref={isActive ? activeWordRef : undefined}
        className="relative inline-block mx-[0.4em] my-[0.3em] rounded"
      >
        {word.split("").map((ch, i) => {
          let cls = "text-[rgb(var(--sub))]";
          if (isActive && i < typed.length) {
            cls = typed[i] === ch ? "text-[rgb(var(--text))]" : "text-[rgb(var(--error))]";
          } else if (!isActive && index < state.wordIndex) {
            cls = "text-[rgb(var(--text))]";
          }

          return (
            <span key={i} className={`${cls} transition-colors duration-100`}>
              {isActive && i === caretPos && (
                <span ref={caretAnchorRef} className="absolute inline-block w-[1px] h-[1.15em] -translate-y-[0.1em]" />
              )}
              {ch}
            </span>
          );
        })}

        {isActive && caretPos === word.length && (
          <span ref={caretAnchorRef} className="absolute inline-block w-[1px] h-[1.15em] -translate-y-[0.1em]" />
        )}

        {isActive && typed.length > word.length && (
          <span className="text-[rgb(var(--error))] opacity-80">{typed.slice(word.length)}</span>
        )}
      </span>
    );
  }

  const headerStat = testMode === "time"
    ? `${Math.ceil(remainingMs / 1000)}`
    : `${Math.min(state.wordIndex + 1, countWords)}/${countWords}`;

  // Увеличен размер кнопок настроек (text-sm вместо text-xs)
  const navBtnBase = "text-sm lowercase transition-all duration-200 px-3 py-1.5 rounded-md";
  const navBtnActive = `${navBtnBase} text-[rgb(var(--accent))]`;
  const navBtnInactive = `${navBtnBase} text-[rgb(var(--sub))] hover:text-[rgb(var(--text))]`;

  return (
    <div
      className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center font-mono outline-none"
      onMouseDown={(e) => {
        e.preventDefault();
        inputRef.current?.focus();
      }}
    >
      {/* Top Config Bar - увеличены отступы и размеры шрифта */}
      <div className="w-full flex items-center justify-center bg-[rgb(var(--bg))] p-3 rounded-xl mb-10 gap-8 opacity-80 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const v = !punctuation;
              setPunctuation(v);
              localStorage.setItem("punctuation", v ? "1" : "0");
              inputRef.current?.focus();
            }}
            className={punctuation ? navBtnActive : navBtnInactive}
          >
            @ punctuation
          </button>
          <button
            type="button"
            onClick={() => {
              const v = !numbers;
              setNumbers(v);
              localStorage.setItem("numbers", v ? "1" : "0");
              inputRef.current?.focus();
            }}
            className={numbers ? navBtnActive : navBtnInactive}
          >
            # numbers
          </button>
        </div>

        <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--sub))]/50" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setTestMode("time"); inputRef.current?.focus(); }}
            className={testMode === "time" ? navBtnActive : navBtnInactive}
          >
            time
          </button>
          <button
            type="button"
            onClick={() => { setTestMode("words"); inputRef.current?.focus(); }}
            className={testMode === "words" ? navBtnActive : navBtnInactive}
          >
            words
          </button>
        </div>

        <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--sub))]/50" />

        <div className="flex items-center gap-1">
          {testMode === "time" ? (
            [15, 30, 60, 120].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setTimeLimit(s); inputRef.current?.focus(); }}
                className={timeLimit === s ? navBtnActive : navBtnInactive}
              >
                {s}
              </button>
            ))
          ) : (
            [10, 25, 50, 100].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { setCountWords(n); inputRef.current?.focus(); }}
                className={countWords === n ? navBtnActive : navBtnInactive}
              >
                {n}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Typing Header (Stats overlay) - увеличены шрифты */}
      <div className="w-full flex justify-between items-end mb-4 px-2 h-10">
        <div className="text-[rgb(var(--accent))] text-3xl font-bold leading-none transition-opacity duration-300">
          {state.startedAt && !isFinished ? headerStat : ""}
        </div>
        
        <div className={`flex items-center gap-6 transition-opacity duration-500 ${state.startedAt && !isFinished ? "opacity-0" : "opacity-100"}`}>
          <div className="text-[rgb(var(--text))] text-3xl">{wpm} <span className="text-[rgb(var(--sub))] text-lg">wpm</span></div>
          <div className="text-[rgb(var(--text))] text-3xl">{acc}% <span className="text-[rgb(var(--sub))] text-lg">acc</span></div>
        </div>
      </div>

      {/* Typing Box - увеличен размер текста */}
      <div className="w-full relative">
        <div className="wordbox text-3xl leading-[1.6] tracking-wide w-full">
          <div ref={scrollRef} className="wordscroll">
            <div className="relative py-2 px-1">
              <div
                ref={caretRef}
                className={`caret ${
                  caretStyle === "line" ? "caret-line" :
                  caretStyle === "block" ? "caret-block" : "caret-underline"
                }`}
              />
              {words.slice(0, testMode === "words" ? countWords : 220).map(renderWord)}
            </div>
          </div>
        </div>

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            const v = e.target.value;
            if (!isFinished) {
              setInput(v);
              if (state.startedAt && !state.endedAt) pushReplayValue(v);
            }
          }}
          onKeyDown={onKeyDown}
          className="absolute opacity-0 pointer-events-none -z-10"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {/* Restart Button */}
      <div className="mt-14 mb-10">
        <button
          onClick={() => { reset(); inputRef.current?.focus(); }}
          className="text-[rgb(var(--sub))] hover:text-[rgb(var(--text))] transition-colors p-4 rounded-xl focus:outline-none focus:bg-[rgb(var(--sub))]/10"
          aria-label="Restart Test"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Bottom Settings */}
      <div className={`flex flex-wrap items-center justify-center gap-8 opacity-80 hover:opacity-100 transition-opacity ${state.startedAt && !isFinished ? "invisible" : "visible"}`}>
        <div className="flex items-center gap-2">
          <span className="text-[rgb(var(--sub))] text-sm mr-2 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            wordlist
          </span>
          {Object.entries(WORDLISTS).map(([key, v]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                const k = key as WordlistKey;
                localStorage.setItem("wordlist", k);
                setWordlist(k);
                inputRef.current?.focus();
              }}
              className={wordlist === key ? navBtnActive : navBtnInactive}
            >
              {v.label}
            </button>
          ))}
        </div>

        <CaretStyleBar 
          value={caretStyle} 
          onChange={(v) => { setCaretStyle(v); inputRef.current?.focus(); }} 
        />
      </div>
    </div>
  );
}