"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/hooks/utils/supabase/client";

export default function AuthBar() {
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setEmail(data.session?.user?.email ?? null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signInGoogle() {
    await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {email ? (
        <>
          <span className="text-white/70 text-sm">{email}</span>
          <a href="/profile" className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm">
            profile
          </a>
          <a href="/me" className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-sm">
            my stats
          </a>
          <button
            type="button"
            onClick={signOut}
            className="px-3 py-1 rounded bg-white text-black hover:opacity-90 text-sm"
          >
            sign out
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={signInGoogle}
          className="px-3 py-1 rounded bg-white text-black hover:opacity-90 text-sm"
        >
          sign in with google
        </button>
      )}
    </div>
  );
}