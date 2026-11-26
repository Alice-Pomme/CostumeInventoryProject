"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { FicheHabillage } from "@/components/FicheHabillage";
import { SafeImage } from "@/components/SafeImage";
import { Button, PageShell } from "@/components/ui";
import type { CostumePieceWithPiece } from "@/types/database";

type Costume = {
  id: string;
  nom: string;
  theme: string | null;
  description: string | null;
  photo_url: string | null;
  nombre?: number | null;
};

export function CostumePrintClient({ costumeId }: { costumeId: string }) {
  const [costume, setCostume] = useState<Costume | null>(null);
  const [links, setLinks] = useState<CostumePieceWithPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/costumes/${costumeId}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const body = (await res.json()) as {
      ok?: boolean;
      costume?: Costume;
      links?: CostumePieceWithPiece[];
      message?: string;
    };
    if (!body.ok || !body.costume) {
      setCostume(null);
      setError(body.message || "Impossible de charger le costume.");
      return;
    }
    setCostume(body.costume);
    setLinks(Array.isArray(body.links) ? body.links : []);
    setError(null);
  }, [costumeId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch {
        if (!cancelled) setError("Impossible de joindre l’API costume.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  if (loading) {
    return (
      <PageShell title="Costume" description="Chargement…">
        <p className="text-sm text-zinc-500">Chargement…</p>
      </PageShell>
    );
  }

  if (error || !costume) {
    return (
      <PageShell title="Costume">
        <p className="text-sm text-red-600 dark:text-red-300">
          {error || "Costume introuvable."}
        </p>
        <Link href="/costumes" className="mt-4 inline-block text-sm underline">
          ← Retour aux costumes
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={costume.nom}
      description="Fiche d’habillage et ordre d’assemblage."
      actions={
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <Link
            href={`/costumes/${costume.id}/edit`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </Link>
          <Link
            href="/costumes"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            ← Retour
          </Link>
        </div>
      }
    >
      <div className="mb-8 flex flex-wrap items-start gap-6 print:hidden">
        <SafeImage
          src={costume.photo_url}
          className="h-40 w-40 rounded object-cover"
          fallback={
            <div className="flex h-40 w-40 items-center justify-center rounded bg-zinc-100 text-sm text-zinc-400 dark:bg-zinc-900">
              Photo
            </div>
          }
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Quantité : {costume.nombre ?? 1}
            {costume.theme ? ` · Thème : ${costume.theme}` : ""}
          </p>
          {costume.description ? (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {costume.description}
            </p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            onClick={() => window.print()}
          >
            Imprimer
          </Button>
        </div>
      </div>

      <FicheHabillage
        costumeNom={costume.nom}
        theme={costume.theme}
        description={costume.description}
        nombre={costume.nombre}
        items={links}
      />
    </PageShell>
  );
}
