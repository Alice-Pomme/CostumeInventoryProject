"use client";

import { useEffect } from "react";
import Link from "next/link";
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
  useEffect(() => {
    console.error("Pieces route error:", {
      digest: error?.digest ?? null,
      message: error?.message ?? null,
      name: error?.name ?? null,
    });
  }, [error]);

  const digest =
    typeof error?.digest === "string" ? error.digest : undefined;
  const recover = retry ?? reset;

  return (
    <PageShell title="Erreur — Pièces">
      <p className="mb-2 text-sm text-red-700 dark:text-red-300">
        Impossible d’afficher cette page. Une erreur serveur s’est produite
        pendant le rendu.
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
        <Link
          href="/costumes"
          className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
        >
          Costumes
        </Link>
      </div>
    </PageShell>
  );
}
