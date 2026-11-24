import { Shirt } from "lucide-react";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function Home() {
  const configured = hasSupabaseEnv();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-lg flex-col items-start gap-6 py-24">
        <div className="flex items-center gap-3 text-zinc-900 dark:text-zinc-50">
          <Shirt className="h-8 w-8" aria-hidden />
          <h1 className="text-3xl font-semibold tracking-tight">
            Costume Inventory
          </h1>
        </div>
        <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Next.js App Router scaffold with Supabase client helpers for{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
            pieces
          </code>
          ,{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
            costumes
          </code>
          ,{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
            costume_pieces
          </code>
          , and{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
            commandes
          </code>
          .
        </p>
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            configured
              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              : "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100"
          }`}
        >
          {configured
            ? "Supabase env vars detected — ready to query."
            : "Supabase env not set. Copy .env.local.example → .env.local and add NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY."}
        </p>
      </main>
    </div>
  );
}
