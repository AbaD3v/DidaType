import TypingTest from "@/components/TypingTest";
import ThemeBar from "@/components/ThemeBar";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <div className="text-[rgb(var(--accent))] text-sm tracking-widest uppercase">
              DidaType
            </div>
            <h1 className="text-3xl font-semibold mt-1">
              typing test
            </h1>
            <p className="text-[rgb(var(--muted))] mt-2">
              time/words · wpm · accuracy · errors
            </p>
          </div>

          <ThemeBar />
          <a
  href="/leaderboard"
  className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm"
>
  leaderboard
</a>
        </div>

        <TypingTest />
        <div className="mt-10 text-[rgb(var(--muted))] text-sm">
          tip: click the test area to focus · space/enter to submit a word
        </div>
      </div>
    </main>
  );
}