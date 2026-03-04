"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { TestMode, TypingState, calcAccuracy, calcWpm, pickWords } from "@/lib/typing";
import CaretStyleBar from "@/components/CaretStyleBar";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/hooks/utils/supabase/client";


const WORD_POOL = [
  "react","next","typescript","tailwind","supabase","project","student","rent",
  "keyboard","speed","focus","practice","random","modern","design","client",
  "server","route","component","state","effect","accuracy","error","progress",
  "future","simple","clean","fast","build","launch","product","startup"
];

type Props = {
  mode?: TestMode;
  timeLimitSec?: number;    // для time режима
  wordsCount?: number;      // для words режима
};

function now() {
  return Date.now();
}

export default function TypingTest({
  mode = "time",
  timeLimitSec = 30,
  wordsCount = 25,
}: Props) {
  const [testMode, setTestMode] = useState<TestMode>(mode);
  const [timeLimit, setTimeLimit] = useState(timeLimitSec);
  const [countWords, setCountWords] = useState(wordsCount);

  const [words, setWords] = useState<string[]>([]);
  const [input, setInput] = useState(""); // текущее вводимое слово
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
  const [remainingMs, setRemainingMs] = useState<number>(timeLimit * 1000);

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
    const picked = pickWords(WORD_POOL, testMode === "words" ? countWords : 200); // в time пусть будет большой запас
    setWords(picked);
    setInput("");
    setRemainingMs(timeLimit * 1000);
    savedOnceRef.current = false;
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
    // фокус
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      updateCaretPosition();
    });
  }

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testMode, timeLimit, countWords]);

  // Таймер для time-режима
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

    // restore caret style from localStorage on mount
    useEffect(() => {
      const saved = (localStorage.getItem("caretStyle") as any) ?? "line";
      if (saved === "line" || saved === "block" || saved === "underline") setCaretStyle(saved);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      localStorage.setItem("caretStyle", caretStyle);
    }, [caretStyle]);

    function updateCaretPosition() {
      const caret = caretRef.current;
      const anchor = caretAnchorRef.current;
      if (!caret || !anchor) return;

      const container = caret.parentElement; // relative container inside scroll
      if (!container) return;

      const a = anchor.getBoundingClientRect();
      const c = container.getBoundingClientRect();

      const x = a.left - c.left;
      const y = a.top - c.top;

      caret.style.transform = `translate(${x}px, ${y}px)`;
    }

    async function saveResultToSupabase(payload: {
      mode: "time" | "words";
      wpm: number;
      accuracy: number;
      errors: number;
      duration_ms: number;
      time_limit_sec?: number | null;
      words_count?: number | null;
    }) {
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

      if (error) throw error;
      return data as { id: string; created_at: string };
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
  const sc = scrollRef.current;
  const el = activeWordRef.current;
  if (!sc || !el) return;

  const scRect = sc.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  const elTopInScroll = (elRect.top - scRect.top) + sc.scrollTop;

  const lineHeight = 44; // высота focusline
  const centerOffset = sc.clientHeight / 2 - lineHeight / 2;

  const target = Math.max(0, elTopInScroll - centerOffset);
  sc.scrollTo({ top: target, behavior: "smooth" });
}, [state.wordIndex]);

useEffect(() => {
  if (!isFinished) return;
  if (!state.startedAt || !state.endedAt) return;
  if (savedOnceRef.current) return;

  savedOnceRef.current = true;

  const payload = {
    mode: testMode,
    wpm,
    accuracy: acc,
    errors: state.errors,
    duration_ms: elapsedMs,
    time_limit_sec: testMode === "time" ? timeLimit : null,
    words_count: testMode === "words" ? countWords : null,
  };

  (async () => {
    try {
      const saved = await saveResultToSupabase(payload as any);
      const resultForPage = { ...payload, ...saved };

      sessionStorage.setItem("lastResult", JSON.stringify(resultForPage));
      router.push("/results");
    } catch (e) {
      sessionStorage.setItem("lastResult", JSON.stringify(payload));
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
      const t = wordTyped[i] ?? "";
      const e = expected[i] ?? "";
      const r = scoreChar(t, e);
      correct += r.correct;
      errors += r.error;
    }

    setState((s) => {
      const nextWordIndex = s.wordIndex + 1;

      const typedCharsAdd = wordTyped.length + 1; // + пробел
      const correctCharsAdd = correct;
      const errorsAdd = errors;

      const next: TypingState = {
        ...s,
        wordIndex: nextWordIndex,
        charIndex: 0,
        typedChars: s.typedChars + typedCharsAdd,
        correctChars: s.correctChars + correctCharsAdd,
        errors: s.errors + errorsAdd,
      };

      return next;
    });

    setInput("");
    requestAnimationFrame(updateCaretPosition);
    finishIfWordsDone(state.wordIndex + 1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isFinished) return;

    // старт по первому действию
    if (e.key.length === 1 || e.key === "Backspace" || e.key === " ") {
      startIfNeeded();
    }

    if (e.key === " ") {
      e.preventDefault();
      commitWord(input);
      return;
    }

    if (e.key === "Enter") {
      // на Enter тоже засчитываем слово
      e.preventDefault();
      commitWord(input);
      return;
    }
  }

  // Визуализация слова: подсветка символов + anchor для caret
  function renderWord(word: string, index: number) {
    const isActive = index === state.wordIndex;
    const typed = isActive ? input : "";

    const caretPos = Math.min(typed.length, word.length); // позиция внутри слова

    return (
      <span
        key={index}
        ref={isActive ? activeWordRef : undefined}
        className={[
          "relative inline-block mr-2 mb-2 px-1 rounded",
          isActive ? "bg-white/5" : "",
        ].join(" ")}
      >
        {word.split("").map((ch, i) => {
          let cls = "text-[rgb(var(--muted))]";
          if (isActive && i < typed.length) {
            cls = typed[i] === ch ? "text-[rgb(var(--text))]" : "text-[rgb(var(--bad))]";
          }

          return (
            <span key={i} className={cls}>
              {/* если caret должен быть перед этим символом */}
              {isActive && i === caretPos ? (
                <span ref={caretAnchorRef} className="inline-block w-[1px] h-[1em] align-baseline" />
              ) : null}
              {ch}
            </span>
          );
        })}

        {/* caret если он в конце слова */}
        {isActive && caretPos === word.length ? (
          <span ref={caretAnchorRef} className="inline-block w-[1px] h-[1em] align-baseline" />
        ) : null}

        {/* лишние символы после слова */}
        {isActive && typed.length > word.length ? (
          <span className="text-[rgb(var(--bad))]">{typed.slice(word.length)}</span>
        ) : null}
      </span>
    );
  }

  const headerStat = testMode === "time"
    ? `${Math.ceil(remainingMs / 1000)}s`
    : `${Math.min(state.wordIndex + 1, countWords)}/${countWords}`;

  return (
    <div
      className="w-full"
      onMouseDown={() => inputRef.current?.focus()}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-baseline gap-4">
  <div className="text-2xl font-semibold">{wpm} WPM</div>
  <div className="text-[rgb(var(--muted))]">{acc}% accuracy</div>
  <div className="text-[rgb(var(--muted))]">{state.errors} errors</div>
</div>

        <div className="flex items-center gap-3">
          <div className="text-white/70">{headerStat}</div>

          <button
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/15"
            onClick={reset}
            type="button"
          >
            Restart
          </button>
        </div>
      </div>

      <div className="w-full mt-3">
        <CaretStyleBar value={caretStyle} onChange={setCaretStyle} />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="wordbox">
          <div className="focusline" />

          <div ref={scrollRef} className="wordscroll">
            <div className="relative leading-8 text-lg select-none py-6 px-2">
              {/* overlay caret */}
              <div
                ref={caretRef}
                className={[
                  "caret",
                  caretStyle === "line" ? "caret-line" : "",
                  caretStyle === "block" ? "caret-block" : "",
                  caretStyle === "underline" ? "caret-underline" : "",
                ].join(" ")}
              />
              {words.slice(0, testMode === "words" ? countWords : 220).map(renderWord)}
            </div>
          </div>
        </div>

        {/* скрытый инпут */}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => !isFinished && setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="absolute opacity-0 pointer-events-none"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2 items-center">
        <div className="text-white/70 mr-2">Mode:</div>

        <button
          type="button"
          onClick={() => setTestMode("time")}
          className={[
            "px-3 py-1 rounded",
            testMode === "time" ? "bg-white text-black" : "bg-white/10 hover:bg-white/15",
          ].join(" ")}
        >
          time
        </button>

        <button
          type="button"
          onClick={() => setTestMode("words")}
          className={[
            "px-3 py-1 rounded",
            testMode === "words" ? "bg-white text-black" : "bg-white/10 hover:bg-white/15",
          ].join(" ")}
        >
          words
        </button>

        {testMode === "time" ? (
          <>
            <div className="w-px h-6 bg-white/10 mx-2" />
            {[15, 30, 60].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTimeLimit(s)}
                className={[
                  "px-3 py-1 rounded",
                  timeLimit === s ? "bg-white text-black" : "bg-white/10 hover:bg-white/15",
                ].join(" ")}
              >
                {s}s
              </button>
            ))}
          </>
        ) : (
          <>
            <div className="w-px h-6 bg-white/10 mx-2" />
            {[10, 25, 50].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCountWords(n)}
                className={[
                  "px-3 py-1 rounded",
                  countWords === n ? "bg-white text-black" : "bg-white/10 hover:bg-white/15",
                ].join(" ")}
              >
                {n}
              </button>
            ))}
          </>
        )}
      </div>

      {isFinished ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-xl font-semibold mb-2">Finished</div>
          <div className="text-white/80">
            {wpm} WPM · {acc}% accuracy · {state.errors} errors · {(elapsedMs / 1000).toFixed(1)}s
          </div>
        </div>
      ) : null}
    </div>
  );
}