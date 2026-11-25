"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createPieceForm } from "@/app/actions/create-piece";
import { Button, Field, TextArea, TextInput } from "@/components/ui";

type PieceRow = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number;
  notes: string | null;
};

export function PiecesClient() {
  const [pieces, setPieces] = useState<PieceRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/pieces", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (res.status === 401) {
          if (!cancelled) {
            setPieces([]);
            setLoadError("Connexion Cursor requise pour charger les pièces.");
            setLoading(false);
          }
          return;
        }
        const body = (await res.json()) as {
          ok?: boolean;
          pieces?: PieceRow[];
          error?: string | null;
        };
        if (cancelled) return;
        setPieces(Array.isArray(body.pieces) ? body.pieces : []);
        setLoadError(
          body.ok ? null : "Impossible de charger les pièces depuis Supabase.",
        );
      } catch {
        if (!cancelled) {
          setPieces([]);
          setLoadError("Impossible de joindre l’API pièces.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-10">
      {loadError ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {loadError} Vous pouvez aussi ajouter des lignes dans Supabase →
          Table Editor → <code className="text-xs">pieces</code>.
        </p>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Nouvelle pièce
        </h2>
        <form action={createPieceForm} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom *">
            <TextInput
              name="nom"
              required
              placeholder="Ex. Chemise blanche"
              autoComplete="off"
            />
          </Field>
          <Field label="Catégorie">
            <TextInput
              name="categorie"
              placeholder="Ex. Haut"
              autoComplete="off"
            />
          </Field>
          <Field label="Stock total">
            <TextInput
              name="stock_total"
              type="number"
              min={0}
              defaultValue={0}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <TextArea name="notes" placeholder="Notes optionnelles" />
            </Field>
          </div>
          <div className="flex items-end">
            <Button type="submit">
              <Plus className="mr-1.5 h-4 w-4" />
              Enregistrer la pièce
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Liste ({loading ? "…" : pieces.length})
        </h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Chargement…</p>
        ) : pieces.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Aucune pièce pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {pieces.map((piece) => (
              <li key={piece.id}>
                <Link
                  href={`/pieces/${piece.id}`}
                  className="block py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {piece.nom}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {piece.categorie || "Sans catégorie"}
                    {` · stock ${piece.stock_total}`}
                    {piece.notes ? ` · ${piece.notes.slice(0, 80)}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
