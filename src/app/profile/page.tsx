// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/hooks/utils/supabase/client";

export default function ProfilePage() {
  const supabase = createSupabaseBrowser();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id ?? null;
      setUserId(id);

      if (id) {
        const { data: p } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", id)
          .maybeSingle();

        if (p?.username) setUsername(p.username);
      }
    })();
  }, []);

  async function save() {
    setSaved(null);
    if (!userId) {
      setSaved("Need login first (later we add auth UI).");
      return;
    }

    const u = username.trim();
    if (u.length < 3) return setSaved("Username must be 3+ chars.");
    if (u.length > 20) return setSaved("Username max 20 chars.");

    const { error } = await supabase.from("profiles").upsert({ id: userId, username: u });
    if (error) return setSaved(error.message);

    setSaved("Saved ✅");
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="text-[rgb(var(--accent))] text-sm tracking-widest uppercase">didatype</div>
        <h1 className="text-3xl font-semibold mt-1">profile</h1>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <label className="block text-white/70 text-sm mb-2">username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 outline-none"
            placeholder="e.g. erasyl"
          />

          <button
            onClick={save}
            className="mt-4 px-4 py-2 rounded bg-white text-black hover:opacity-90"
            type="button"
          >
            Save
          </button>

          {saved ? <div className="mt-3 text-white/60 text-sm">{saved}</div> : null}
        </div>

        <a href="/" className="inline-block mt-8 text-white/70 hover:text-white">
          ← back
        </a>
      </div>
    </main>
  );
}