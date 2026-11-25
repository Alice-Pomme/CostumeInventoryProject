"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createPiece, type PieceActionState } from "@/app/actions/pieces";
import { CategorieCombobox } from "@/components/CategorieCombobox";
import { PhotoDropzone } from "@/components/PhotoDropzone";
import { Button, Field, TextArea, TextInput } from "@/components/ui";

const initialState: PieceActionState = { error: null };

export function NewPieceForm({ categories }: { categories: string[] }) {
  const [open, setOpen] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(createPiece, initialState);

  useEffect(() => {
    if (!state.createdId || state.error) return;
    setNotice(
      state.photoWarning
        ? `Pièce enregistrée (photo non téléversée : ${state.photoWarning}).`
        : "Pièce enregistrée dans Supabase.",
    );
    setOpen(false);
  }, [state.createdId, state.error, state.photoWarning]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setNotice(null);
            setOpen((v) => !v);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {open ? "Fermer" : "Nouvelle pièce"}
        </Button>
      </div>

      {notice ? (
        <p
          role="status"
          className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
        >
          {notice}{" "}
          {state.createdId ? (
            <Link
              href={`/pieces/${state.createdId}`}
              className="font-medium underline underline-offset-2"
            >
              Ouvrir la fiche
            </Link>
          ) : null}{" "}
          <Link href="/pieces" className="underline underline-offset-2">
            Actualiser la liste
          </Link>
        </p>
      ) : null}

      {open ? (
        <section className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
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
              <TextInput
                name="nom"
                required
                placeholder="Ex. Chemise blanche"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </Field>
            <div className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Catégorie
              </span>
              <CategorieCombobox options={categories} />
            </div>
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
        </section>
      ) : null}
    </div>
  );
}
