// src/components/AuthBar.tsx
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/hooks/utils/supabase/client";
import Link from "next/link";

/**
 * AuthBar: Polished Monkeytype-style Auth Navigation
 * Aesthetic: Serika Dark (Minimalism, low contrast base, high contrast accents)
 */

export default function AuthBar() {
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setEmail(data.session?.user?.email ?? null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signInGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const btnBase = "transition-all duration-200 text-xs lowercase flex items-center gap-1.5 px-2 py-1 rounded-md";
  const btnGhost = `${btnBase} text-[rgb(var(--sub))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--sub)/0.1)]`;
  const btnAccent = `${btnBase} bg-[rgb(var(--accent))] text-[rgb(var(--bg))] font-bold hover:brightness-110`;

  return (
    <div className="flex items-center gap-4 font-mono">
      {email ? (
        <div className="flex items-center gap-3">
          <span className="text-[rgb(var(--sub))] text-xs cursor-default">
            {email}
          </span>
          
          <nav className="flex items-center gap-1">
            <Link href="/profile" className={btnGhost}>
              profile
            </Link>
            <Link href="/me" className={btnGhost}>
              stats
            </Link>
            <button
              onClick={signOut}
              className={btnGhost}
            >
              sign out
            </button>
          </nav>
        </div>
      ) : (
        <button
          onClick={signInGoogle}
          className={btnAccent}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.024 1.024-2.616 2.12-5.912 2.12-5.388 0-9.712-4.36-9.712-9.712s4.324-9.712 9.712-9.712c2.928 0 5.12 1.152 6.64 2.584l2.308-2.308c-1.96-1.856-4.524-3.276-8.948-3.276-7.828 0-14.128 6.3-14.128 14.128s6.3 14.128 14.128 14.128c4.224 0 7.412-1.392 9.872-3.96 2.532-2.532 3.328-6.088 3.328-8.78 0-.84-.068-1.644-.192-2.408h-13.016z" />
          </svg>
          sign in with google
        </button>
      )}
    </div>
  );
}