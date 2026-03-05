// src/app/page.tsx
import TypingTest from "@/components/TypingTest";
import ThemeBar from "@/components/ThemeBar";
import AuthBar from "@/components/AuthBar";
import { 
  Trophy, 
  Calendar, 
  Info, 
  Settings, 
  Github, 
  MessageSquare, 
  Shield, 
  FileText,
  Command,
  Keyboard,
  Circle
} from "lucide-react";

/**
 * DidaType - Final Production Home Component
 * Fully integrated with dynamic theme variables:
 * --bg, --text, --muted, --accent
 */

export default function Home() {
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))] font-mono selection:bg-[rgb(var(--accent))] selection:text-[rgb(var(--bg))] overflow-hidden flex flex-col transition-colors duration-300">
      <div className="w-full max-w-[1400px] mx-auto px-10 flex flex-col flex-grow">
        
        {/* Navigation Header */}
        <header className="flex items-center justify-between py-8 select-none">
          <div className="flex items-center gap-12">
            
            {/* Logo Section */}
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <Keyboard className="w-9 h-9 text-[rgb(var(--accent))] stroke-[1.5] transition-transform duration-300 group-hover:-translate-y-0.5" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[rgb(var(--accent))] rounded-full animate-pulse shadow-[0_0_8px_rgb(var(--accent))]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-[rgb(var(--muted))] tracking-[0.25em] uppercase ml-0.5 opacity-70">
                  didatype see
                </span>
                <h1 className="text-[rgb(var(--text))] text-2xl font-bold lowercase tracking-tighter transition-colors group-hover:text-[rgb(var(--accent))]">
                  didatype
                </h1>
              </div>
            </div>

            {/* Main Icon Navigation */}
            <nav className="flex items-center gap-7">
              <a href="/leaderboard" title="Leaderboard" className="text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition-all group">
                <Trophy size={20} className="group-hover:text-[rgb(var(--accent))] transition-colors stroke-[1.25]" />
              </a>
              <a href="/daily" title="Daily Challenge" className="text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition-all group">
                <Calendar size={20} className="group-hover:text-[rgb(var(--accent))] transition-colors stroke-[1.25]" />
              </a>
              <a href="/about" title="Information" className="text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition-all group">
                <Info size={20} className="group-hover:text-[rgb(var(--accent))] transition-colors stroke-[1.25]" />
              </a>
            </nav>
          </div>

          {/* Top-Right Controls */}
          <div className="flex items-center gap-8">
            <ThemeBar />
            <AuthBar />
          </div>
        </header>

        {/* Central Testing Environment */}
        <section className="flex-grow flex flex-col justify-center items-center w-full py-12">
          <div className="w-full transition-all duration-500 ease-in-out">
            <TypingTest />
          </div>
        </section>

{/* Keyboard Shortcuts */}
<div className="flex flex-col items-center gap-8 pb-10 select-none">

  <div className="flex flex-wrap items-center justify-center gap-8 text-[13px]">

    {/* restart */}
    <div className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-[rgb(var(--text))]/5 transition-all duration-200 group">
      <kbd className="bg-[rgb(var(--muted))]/10 px-2 py-0.5 rounded text-[11px] border-b-[3px] border-black/30 min-w-[34px] text-center font-bold">tab</kbd>
      <span className="text-[rgb(var(--muted))] opacity-50">/</span>
      <kbd className="bg-[rgb(var(--muted))]/10 px-2 py-0.5 rounded text-[11px] border-b-[3px] border-black/30 min-w-[34px] text-center font-bold">esc</kbd>
      <span className="text-[rgb(var(--muted))] group-hover:text-[rgb(var(--text))] tracking-wide font-medium">
        restart
      </span>
    </div>

    {/* ctrl enter */}
    <div className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-[rgb(var(--text))]/5 transition-all duration-200 group">
      <kbd className="bg-[rgb(var(--muted))]/10 px-2 py-0.5 rounded text-[11px] border-b-[3px] border-black/30 min-w-[40px] text-center font-bold">ctrl</kbd>
      <span className="opacity-20 text-lg">+</span>
      <kbd className="bg-[rgb(var(--muted))]/10 px-2 py-0.5 rounded text-[11px] border-b-[3px] border-black/30 min-w-[48px] text-center font-bold">enter</kbd>
      <span className="text-[rgb(var(--muted))] group-hover:text-[rgb(var(--text))] tracking-wide font-medium">
        restart test
      </span>
    </div>

    {/* next word */}
    <div className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-[rgb(var(--text))]/5 transition-all duration-200 group">
      <kbd className="bg-[rgb(var(--muted))]/10 px-2 py-0.5 rounded text-[11px] border-b-[3px] border-black/30 min-w-[52px] text-center font-bold">space</kbd>
      <span className="text-[rgb(var(--muted))] opacity-50">/</span>
      <kbd className="bg-[rgb(var(--muted))]/10 px-2 py-0.5 rounded text-[11px] border-b-[3px] border-black/30 min-w-[48px] text-center font-bold">enter</kbd>
      <span className="text-[rgb(var(--muted))] group-hover:text-[rgb(var(--text))] tracking-wide font-medium">
        next word
      </span>
    </div>

  </div>

          {/* Visual Legend Indicators */}
          <div className="flex items-center gap-12 opacity-15 text-[rgb(var(--muted))]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.4em] uppercase font-black">wpm</span>
              <Circle size={4} className="fill-current" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.4em] uppercase font-black">accuracy</span>
              <Circle size={4} className="fill-current" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.4em] uppercase font-black">consistency</span>
              <Circle size={4} className="fill-current" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] tracking-[0.4em] uppercase font-black">raw</span>
            </div>
          </div>
        </div>

        {/* Global System Footer */}
        <footer className="flex justify-between items-center py-6 text-[12px] border-t border-[rgb(var(--muted))]/10">
          <div className="flex items-center gap-8 text-[rgb(var(--muted))]">
            <a href="https://github.com/AbaD3v/DidaType" className="flex items-center gap-2 hover:text-[rgb(var(--text))] transition-colors group">
              <Github size={15} strokeWidth={1.5} className="group-hover:text-[rgb(var(--accent))]" /> 
              github
            </a>
            <a href="/about" className="flex items-center gap-2 hover:text-[rgb(var(--text))] transition-colors group">
              <FileText size={15} strokeWidth={1.5} className="group-hover:text-[rgb(var(--accent))]" /> 
              about
            </a>
          </div>
          
          <div className="flex items-center gap-5 select-none">
            <div className="flex items-center gap-2.5 px-3 py-1 rounded bg-[rgb(var(--muted))]/5 border border-[rgb(var(--muted))]/10">
              <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent))] animate-pulse" />
              <span className="text-[rgb(var(--text))] text-[10px] font-bold uppercase tracking-wider opacity-80">
                system operational
              </span>
            </div>
            <span className="text-[rgb(var(--muted))] opacity-40 font-bold tracking-tighter text-[11px]">
              v1.0
            </span>
          </div>
        </footer>

      </div>
    </main>
  );
}