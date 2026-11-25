"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { createPiece, type PieceActionState } from "@/app/actions/pieces";
import { CategorieCombobox } from "@/components/CategorieCombobox";
import { PhotoDropzone } from "@/components/PhotoDropzone";
import { SafeImage } from "@/components/SafeImage";
import { Button, Field, TextArea, TextInput } from "@/components/ui";

export type PieceRow = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number | null;
  photo_url: string | null;
  notes: string | null;
};

const COLUMNS = [
  { key: "photo", label: "Photo" },
  { key: "nom", label: "Nom" },
  { key: "categorie", label: "Catégorie" },
  { key: "stock_total", label: "Stock total" },
  { key: "notes", label: "Notes" },
] as const;

const initialState: PieceActionState = { error: null };

export function PiecesInventory({
  pieces,
  categories,
}: {
  pieces: PieceRow[];
  categories: string[];
}) {
  const [adding, setAdding] = useState(pieces.length === 0);
  const [state, formAction, pending] = useActionState(createPiece, initialState);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {pieces.length === 0
            ? "Base vide — aucune pièce enregistrée."
            : `${pieces.length} pièce${pieces.length > 1 ? "s" : ""}`}
        </p>
        <Button
          type="button"
          onClick={() => setAdding((open) => !open)}
          aria-expanded={adding}
          aria-controls="nouvelle-piece-form"
        >
          {adding ? (
            <>
              <X className="mr-1.5 h-4 w-4" />
              Fermer
            </>
          ) : (
            <>
              <Plus className="mr-1.5 h-4 w-4" />
              Nouvelle pièce
            </>
          )}
        </Button>
      </div>

      {adding ? (
        <section
          id="nouvelle-piece-form"
          className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          <h2 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Ajouter une pièce
          </h2>
          {state.error ? (
            <p
              role="alert"
              className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
            >
              {state.error}
            </p>
          ) : null}
          <form
            action={formAction}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Field label="Nom *">
              <TextInput name="nom" required placeholder="Ex. Chemise blanche" />
            </Field>
            <Field label="Catégorie">
              <CategorieCombobox options={categories} />
            </Field>
            <Field label="Stock total">
              <TextInput
                name="stock_total"
                type="number"
                min={0}
                defaultValue={0}
              />
            </Field>
            <Field label="Notes">
              <TextArea name="notes" placeholder="Notes optionnelles" rows={1} />
            </Field>
            <div className="sm:col-span-2 lg:col-span-4">
              <Field label="Photo">
                <PhotoDropzone />
              </Field>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" disabled={pending}>
                <Plus className="mr-1.5 h-4 w-4" />
                {pending ? "Enregistrement…" : "Enregistrer la pièce"}
              </Button>
            </div>
          </form>
          <p className="mt-3 text-xs text-zinc-500">
            Enregistrement serveur vers Supabase (table{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">pieces</code>
            ). Une fois : exécutez{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
              docs/sql/schema.sql
            </code>{" "}
            et configurez le secret{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
              SUPABASE_SERVICE_ROLE_KEY
            </code>
            .
          </p>
        </section>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {pieces.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-4 py-16 text-center text-zinc-500"
                >
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    Aucune pièce dans la base
                  </p>
                  <p className="mt-1 text-sm">
                    Colonnes : nom, catégorie, stock total, photo, notes.
                  </p>
                  <Button
                    type="button"
                    className="mt-4"
                    onClick={() => setAdding(true)}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Ajouter la première pièce
                  </Button>
                </td>
              </tr>
            ) : (
              pieces.map((piece) => (
                <tr
                  key={piece.id}
                  className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3">
                    <Link href={`/pieces/${piece.id}`} className="block">
                      <SafeImage
                        src={piece.photo_url}
                        className="h-12 w-12 rounded object-cover"
                        fallback={
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-400 dark:bg-zinc-900">
                            —
                          </div>
                        }
                      />
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/pieces/${piece.id}`}
                      className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
                    >
                      {piece.nom}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {piece.categorie || "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                    {piece.stock_total ?? 0}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-500">
                    {piece.notes || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
