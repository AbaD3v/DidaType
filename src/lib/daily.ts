import { WORDLISTS, WordlistKey } from "@/lib/wordlists";
import { hashStringToSeed, mulberry32 } from "@/lib/seeded";

const PUNCT = [".", ",", "!", "?", ";", ":"];
const DIGITS = "0123456789";

function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffleSeeded<T>(arr: T[], rng: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function maybeAddPunct(word: string, rng: () => number) {
  if (rng() < 0.18) return word + PUNCT[randInt(rng, 0, PUNCT.length - 1)];
  return word;
}

function makeNumberToken(rng: () => number) {
  const len = randInt(rng, 1, 4);
  let s = "";
  for (let i = 0; i < len; i++) s += DIGITS[randInt(rng, 0, DIGITS.length - 1)];
  return s;
}

export type DailyConfig = {
  day: string; // "YYYY-MM-DD"
  wordlist: WordlistKey;
  count: number;
  punctuation: boolean;
  numbers: boolean;
  mode: "time" | "words";
  timeLimitSec?: number;
  wordsCount?: number;
};

export function generateDailyTokens(cfg: DailyConfig) {
  const seedStr = [
    "daily",
    cfg.day,
    cfg.wordlist,
    cfg.count,
    cfg.punctuation ? "p1" : "p0",
    cfg.numbers ? "n1" : "n0",
    cfg.mode,
    cfg.timeLimitSec ?? "",
    cfg.wordsCount ?? "",
  ].join("|");

  const seed = hashStringToSeed(seedStr);
  const rng = mulberry32(seed);

  const pool = WORDLISTS[cfg.wordlist].words;
  const base = shuffleSeeded(pool, rng);

  const out: string[] = [];
  let i = 0;

  while (out.length < cfg.count) {
    if (cfg.numbers && rng() < 0.12) {
      out.push(makeNumberToken(rng));
      continue;
    }
    const w = base[i % base.length];
    i++;
    out.push(cfg.punctuation ? maybeAddPunct(w, rng) : w);
  }

  return out;
}