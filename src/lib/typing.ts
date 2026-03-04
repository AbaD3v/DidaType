export type TestMode = "time" | "words";

export type TypingState = {
  words: string[];
  wordIndex: number;      // индекс текущего слова
  charIndex: number;      // позиция в текущем слове
  typedChars: number;     // всего набрано символов (включая пробелы)
  correctChars: number;   // корректно набрано
  errors: number;         // кол-во ошибок
  startedAt: number | null;
  endedAt: number | null;
};

/**
 * Перемешивание массива (Алгоритм Фишера — Йетса)
 * Оптимизировано: работаем напрямую с передаваемым количеством.
 */
export function pickWords(pool: string[], count: number): string[] {
  const result = [...pool];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.slice(0, count);
}

/**
 * Расчет WPM (Words Per Minute)
 * Стандартная формула: $$WPM = \frac{(\text{correctChars} / 5)}{\text{timeInMinutes}}$$
 * 5 — это средняя длина слова (включая пробел).
 */
export function calcWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 1000) return 0; // Игнорируем замеры меньше секунды для точности
  const minutes = elapsedMs / 60000;
  const wpm = (correctChars / 5) / minutes;
  return Math.max(0, Math.round(wpm));
}

/**
 * Расчет точности (Accuracy)
 * $$Accuracy = \left( \frac{\text{correctChars}}{\text{typedChars}} \right) \times 100$$
 */
export function calcAccuracy(correctChars: number, typedChars: number): number {
  if (typedChars <= 0) return 100;
  const acc = (correctChars / typedChars) * 100;
  return Math.max(0, Math.min(100, Math.round(acc)));
}

/**
 * Хелпер для форматирования времени (например, для отображения длительности теста)
 */
export function formatDuration(ms: number): string {
  const seconds = ms / 1000;
  return seconds.toFixed(1) + "s";
}