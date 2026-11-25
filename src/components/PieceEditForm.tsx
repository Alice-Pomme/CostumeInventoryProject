"use client";

import { deletePiece, updatePiece, uploadPiecePhoto } from "@/app/actions/pieces";
import { CategorieCombobox } from "@/components/CategorieCombobox";
import { PhotoDropzone } from "@/components/PhotoDropzone";
import { Button, Field, TextArea, TextInput } from "@/components/ui";

type Piece = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number | null;
  photo_url: string | null;
  notes: string | null;
};

export function PieceEditForm({
  piece,
  categories,
}: {
  piece: Piece;
  categories: string[];
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Photo
        </h2>
        <form
          action={uploadPiecePhoto.bind(null, piece.id)}
          className="space-y-3"
        >
          <PhotoDropzone existingUrl={piece.photo_url} required={!piece.photo_url} />
          <Button type="submit" variant="secondary" className="w-full">
            Enregistrer la photo
          </Button>
        </form>
      </section>

      <section className="space-y-6">
        <form
          action={updatePiece.bind(null, piece.id)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Nom *">
            <TextInput name="nom" required defaultValue={piece.nom} />
          </Field>
          <Field label="Catégorie">
            <CategorieCombobox
              options={categories}
              defaultValue={piece.categorie ?? ""}
            />
          </Field>
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
            <Button type="submit">Enregistrer</Button>
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
