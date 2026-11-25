"use client";

import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Button, PageShell } from "@/components/ui";

export default function PiecesError({
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
}) {
  const recover = retry ?? reset;

  return (
    <>
      <AppNav />
      <PageShell title="Pièces">
        <p className="mb-4 text-sm text-red-700 dark:text-red-300">
          Impossible d’afficher la liste pour le moment. Vous pouvez saisir des
          pièces dans Supabase (Table Editor → pieces) en attendant.
        </p>
        <div className="flex flex-wrap gap-3">
          {recover ? (
            <Button type="button" onClick={() => recover()}>
              Réessayer
            </Button>
          ) : null}
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
          >
            Accueil
          </Link>
        </div>
      </PageShell>
    </>
  );
}
