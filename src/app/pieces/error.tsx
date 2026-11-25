"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Button, PageShell } from "@/components/ui";

export default function PiecesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Pieces route error:", error);
  }, [error]);

  return (
    <>
      <AppNav />
      <PageShell title="Erreur — Pièces">
        <p className="mb-4 text-sm text-red-700 dark:text-red-300">
          Impossible d’afficher cette page.{" "}
          {error.message
            ? `(${error.message})`
            : "Erreur serveur inattendue."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={reset}>
            Réessayer
          </Button>
          <Link
            href="/pieces"
            className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
          >
            Retour à la liste
          </Link>
        </div>
      </PageShell>
    </>
  );
}
