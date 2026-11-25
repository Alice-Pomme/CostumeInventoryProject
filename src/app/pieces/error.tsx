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

  const digest =
    typeof error.digest === "string" ? error.digest : undefined;
  const message =
    error instanceof Error && error.message
      ? error.message.replace(/^Minified React error #\d+;.*/i, "").trim()
      : "";

  return (
    <>
      <AppNav />
      <PageShell title="Erreur — Pièces">
        <p className="mb-2 text-sm text-red-700 dark:text-red-300">
          Impossible d’afficher cette page.
          {message && !message.includes("react.dev/errors")
            ? ` ${message}`
            : " Une erreur serveur s’est produite pendant le rendu."}
        </p>
        {digest ? (
          <p className="mb-4 text-xs text-zinc-500">Réf. {digest}</p>
        ) : null}
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
