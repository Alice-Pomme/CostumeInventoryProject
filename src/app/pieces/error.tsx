"use client";

import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Button, PageShell } from "@/components/ui";

export default function PiecesError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
}) {
  const recover = retry ?? reset;
  const digest =
    typeof error?.digest === "string" ? error.digest : undefined;

  return (
    <>
      <AppNav />
      <PageShell title="Pièces">
        <p className="mb-2 text-sm text-red-700 dark:text-red-300">
          Impossible d’afficher la liste pour le moment.
        </p>
        {digest ? (
          <p className="mb-4 text-xs text-zinc-500">Réf. {digest}</p>
        ) : null}
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
