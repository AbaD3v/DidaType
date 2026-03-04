import { WORDLISTS, WordlistKey } from "@/lib/wordlists";

const PUNCT = [".", ",", "!", "?", ";", ":"];
const DIGITS = "0123456789";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maybeAddPunct(word: string) {
  // 18% шанс добавить пунктуацию в конец
  if (Math.random() < 0.18) {
    return word + PUNCT[randInt(0, PUNCT.length - 1)];
  }
  return word;
}

function maybeMakeNumberToken() {
  // число длиной 1-4
  const len = randInt(1, 4);
  let s = "";
  for (let i = 0; i < len; i++) s += DIGITS[randInt(0, DIGITS.length - 1)];
  return s;
}

export type GenOptions = {
  wordlist: WordlistKey;
  count: number;
  punctuation: boolean;
  numbers: boolean;
};

export function generateTokens(opts: GenOptions) {
  const pool = WORDLISTS[opts.wordlist].words;
  const base = shuffle(pool);

  const out: string[] = [];
  let i = 0;

  while (out.length < opts.count) {
    // numbers: иногда вместо слова вставляем число
    if (opts.numbers && Math.random() < 0.12) {
      out.push(maybeMakeNumberToken());
      continue;
    }

    const w = base[i % base.length];
    i++;

    out.push(opts.punctuation ? maybeAddPunct(w) : w);
  }

  return out;
}