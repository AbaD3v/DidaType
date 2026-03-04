export default function AboutPage() {
  const techStack = ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Framer Motion"];

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))] font-mono">
      <div className="mx-auto w-full max-w-3xl px-8 py-20">
        
        {/* Breadcrumb / Label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px bg-[rgb(var(--accent))] opacity-50" />
          <div className="text-[rgb(var(--sub))] text-xs tracking-[0.3em] uppercase opacity-60">
            project information
          </div>
        </div>

        <h1 className="text-5xl font-black tracking-tighter mb-10">about</h1>

        <div className="space-y-8 text-lg leading-relaxed">
          
          <p className="text-xl">
            <span className="text-[rgb(var(--accent))] font-bold underline decoration-2 underline-offset-4">
              DidaType
            </span>{" "}
            — это минималистичный инструмент, созданный для тех, кто ценит эстетику и хочет довести свой навык слепой печати до совершенства.
          </p>

          <div className="grid gap-6 py-6 border-y border-[rgb(var(--sub))]/10">
            <p>
              Проект фокусируется на чистом опыте набора текста без отвлекающих факторов. 
              После каждого заезда система предоставляет глубокую аналитику: 
              от стандартного <span className="text-[rgb(var(--text))] font-bold">WPM</span> и точности до визуального реплея ваших нажатий.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-[rgb(var(--sub))] italic">
              «Дизайн — это не то, как предмет выглядит, а то, как он работает». 
              Этот проект — эксперимент Дидара Алпысбаева в области современных веб-интерфейсов и производительности.
            </p>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {techStack.map((tech) => (
                <span 
                  key={tech} 
                  className="px-3 py-1 rounded-full bg-[rgb(var(--sub))]/5 border border-[rgb(var(--sub))]/10 text-xs text-[rgb(var(--sub))]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-10 flex flex-col gap-4">
            <a
              href="/"
              className="group flex items-center gap-2 text-[rgb(var(--accent))] font-bold transition-all"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              на главную
            </a>
            
            <p className="text-[rgb(var(--sub))] text-xs opacity-40">
              v1.0.0 // 2026 // Alpyisbayev Didar
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}