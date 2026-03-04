export type TestMode = "time" | "words";

export type TypingState = {
  words: string[];
  wordIndex: number;      // индекс текущего слова
  charIndex: number;      // позиция в текущем слове
  typedChars: number;     // всего набрано символов (включая пробелы)
  correctChars: number;   // корректно набрано (по символам)
  errors: number;         // кол-во ошибок по символам
  startedAt: number | null;
  endedAt: number | null;
};

export function pickWords(pool: string[], count: number) {
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

// стандартная формула: (correctChars/5) / minutes
export function calcWpm(correctChars: number, elapsedMs: number) {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return Math.round((correctChars / 5) / minutes);
}

export function calcAccuracy(correctChars: number, typedChars: number) {
  if (typedChars <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((correctChars / typedChars) * 100)));
}