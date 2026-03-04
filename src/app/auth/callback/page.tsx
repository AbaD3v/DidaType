"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/hooks/utils/supabase/client";

export default function AuthCallbackPage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      router.replace("/"); // или куда хочешь
    })();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-xl mx-auto px-6 py-16 text-white/70">
        signing in...
      </div>
    </main>
  );
}