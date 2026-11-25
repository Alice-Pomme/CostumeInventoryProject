export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { Shirt, Layers } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function Home() {
  await connection();
  const configured = hasSupabaseEnv();

  return (
    <>
      <AppNav />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Inventaire de costumes
        </h1>
        <p className="mt-2 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
          Gérez les pièces individuelles, les costumes complets et l’ordre
          d’habillage.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/pieces"
            className="group border border-zinc-200 p-6 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <Shirt className="mb-3 h-6 w-6 text-zinc-700 dark:text-zinc-300" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Pièces
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Nom, catégorie, stock, photo (Storage) et notes.
            </p>
          </Link>
          <Link
            href="/costumes"
            className="group border border-zinc-200 p-6 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <Layers className="mb-3 h-6 w-6 text-zinc-700 dark:text-zinc-300" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Costumes
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Thème, description et liaison des pièces (quantité + ordre).
            </p>
          </Link>
        </div>

        <p
          className={`mt-8 rounded-md px-3 py-2 text-sm ${
            configured
              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              : "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100"
          }`}
        >
          {configured
            ? "Connexion Supabase configurée."
            : "Variables Supabase absentes dans cet environnement."}
        </p>
      </div>
    </>
  );
}
