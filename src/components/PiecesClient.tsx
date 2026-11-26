"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CategorieCombobox } from "@/components/CategorieCombobox";
import { Button, Field, TextArea, TextInput } from "@/components/ui";

type PieceRow = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number;
  notes: string | null;
};

type ListResponse = {
  ok?: boolean;
  pieces?: PieceRow[];
  categories?: string[];
  error?: string | null;
  message?: string | null;
  host?: string | null;
};

/**
 * Loads / saves via /api/pieces so identity is read from the web Request
 * (gate-injected). RSC headers() was returning missing_header on the host.
 */
export function PiecesClient() {
  const [pieces, setPieces] = useState<PieceRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [host, setHost] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/pieces", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const body = (await res.json()) as ListResponse;
      setHost(typeof body.host === "string" ? body.host : null);
      const nextPieces = Array.isArray(body.pieces) ? body.pieces : [];
      setPieces(nextPieces);
      setCategories(
        Array.isArray(body.categories)
          ? body.categories
          : [
              ...new Set(
                nextPieces
                  .map((p) => (p.categorie ?? "").trim())
                  .filter(Boolean),
              ),
            ].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })),
      );
      if (body.ok) {
        setLoadError(null);
      } else {
        setLoadError(
          body.message ||
            (res.status === 401
              ? "Connexion Cursor requise. Rouvrez l’app depuis Cursor."
              : "Impossible de charger les pièces depuis Supabase."),
        );
      }
    } catch {
      setPieces([]);
      setLoadError("Impossible de joindre l’API pièces.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  function onSubmit(formData: FormData) {
    setSaveError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/pieces", {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        });
        const body = (await res.json()) as {
          ok?: boolean;
          message?: string;
          piece?: PieceRow;
        };
        if (!body.ok) {
          setSaveError(body.message || "Échec de l’enregistrement.");
          return;
        }
        setFormKey((k) => k + 1);
        await refresh();
      } catch {
        setSaveError("Impossible d’enregistrer la pièce.");
      }
    });
  }

  const alert = loadError || saveError;

  return (
    <div className="space-y-10">
      {alert ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {alert}
          {host ? (
            <>
              {" "}
              Projet lié : <code className="text-xs">{host}</code>.
            </>
          ) : null}{" "}
          Vous pouvez aussi gérer les lignes dans Supabase → Table Editor →{" "}
          <code className="text-xs">pieces</code>.
        </p>
      ) : host ? (
        <p className="text-xs text-zinc-500">
          Connecté à <code>{host}</code>
        </p>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Nouvelle pièce
        </h2>
        <form
          key={formKey}
          action={onSubmit}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Nom *">
            <TextInput
              name="nom"
              required
              placeholder="Ex. Chemise blanche"
              autoComplete="off"
            />
          </Field>
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Catégorie
            </span>
            <CategorieCombobox options={categories} placeholder="Ex. Haut" />
          </div>
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
            <Button type="submit" disabled={pending}>
              <Plus className="mr-1.5 h-4 w-4" />
              {pending ? "Enregistrement…" : "Enregistrer la pièce"}
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
