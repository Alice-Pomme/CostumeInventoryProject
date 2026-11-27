"use client";

import { useActionState } from "react";
import {
  deletePiece,
  updatePiece,
  uploadPiecePhoto,
  type PieceActionState,
} from "@/app/actions/pieces";
import { CategorieCombobox } from "@/components/CategorieCombobox";
import { PhotoDropzone } from "@/components/PhotoDropzone";
import { safeImageSrc } from "@/lib/safe-image-url";
import { Button, Field, TextArea, TextInput } from "@/components/ui";

type Piece = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number | null;
  photo_url: string | null;
  notes: string | null;
};

const initialState: PieceActionState = { error: null };

export function PieceEditForm({
  piece,
  categories,
  photoError = null,
}: {
  piece: Piece;
  categories: string[];
  photoError?: string | null;
}) {
  const updateAction = updatePiece.bind(null, piece.id);
  const uploadAction = uploadPiecePhoto.bind(null, piece.id);
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction,
    initialState,
  );
  const [uploadState, uploadFormAction, uploadPending] = useActionState(
    uploadAction,
    initialState,
  );

  const alert = updateState.error || uploadState.error || photoError;

  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Photo
        </h2>
        <form action={uploadFormAction} className="space-y-3">
          <PhotoDropzone
            existingUrl={safeImageSrc(piece.photo_url)}
            required={!safeImageSrc(piece.photo_url)}
          />
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={uploadPending}
          >
            {uploadPending ? "Téléversement…" : "Enregistrer la photo"}
          </Button>
        </form>
      </section>

      <section className="space-y-6">
        {alert ? (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
          >
            {alert}
          </p>
        ) : null}

        <form
          action={updateFormAction}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Nom *">
            <TextInput
              name="nom"
              required
              defaultValue={piece.nom}
              autoComplete="off"
            />
          </Field>
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Catégorie
            </span>
            <CategorieCombobox
              options={categories}
              defaultValue={piece.categorie ?? ""}
            />
          </div>
          <Field label="Stock total">
            <TextInput
              name="stock_total"
              type="number"
              min={0}
              defaultValue={piece.stock_total ?? 0}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <TextArea name="notes" defaultValue={piece.notes ?? ""} />
            </Field>
          </div>
          <div>
            <Button type="submit" disabled={updatePending}>
              {updatePending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>

        <form action={deletePiece.bind(null, piece.id)}>
          <Button type="submit" variant="danger">
            Supprimer la pièce
          </Button>
        </form>
      </section>
    </div>
  );
}
