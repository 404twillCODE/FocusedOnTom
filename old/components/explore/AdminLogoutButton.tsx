"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const supabase = createBrowserSupabaseClient();
        await supabase.auth.signOut();
        router.replace("/explore/admin/login");
        router.refresh();
      }}
      className="rounded-full border border-white/10 px-3 py-1 text-xs tracking-[0.14em] text-[var(--text-muted)]"
    >
      {pending ? "…" : "LOG OUT"}
    </button>
  );
}
