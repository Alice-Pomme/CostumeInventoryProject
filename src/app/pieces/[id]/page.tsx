export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deletePiece,
  updatePiece,
  uploadPiecePhoto,
} from "@/app/actions/pieces";
import { AppNav } from "@/components/AppNav";
import { Button, Field, PageShell, TextArea, TextInput } from "@/components/ui";

type Props = { params: Promise<{ id: string }> };

export default async function PieceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: piece, error } = await supabase
    .from("pieces")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <>
        <AppNav />
        <PageShell title="Pièce">
          <p className="text-sm text-red-600">{error.message}</p>
        </PageShell>
      </>
    );
  }
  if (!piece) notFound();

  return (
    <>
      <AppNav />
      <PageShell
        title={piece.nom}
        description="Modifier la pièce et sa photo."
        actions={
          <Link
            href="/pieces"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            ← Retour aux pièces
          </Link>
        }
      >
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <section>
            {piece.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={piece.photo_url}
                alt={piece.nom}
                className="mb-3 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="mb-3 flex aspect-square items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-400 dark:bg-zinc-900">
                Pas de photo
              </div>
            )}
            <form
              action={uploadPiecePhoto.bind(null, piece.id)}
              className="flex flex-col gap-2"
            >
              <Field label="Photo (bucket photos-pieces)">
                <TextInput name="photo" type="file" accept="image/*" required />
              </Field>
              <Button type="submit" variant="secondary">
                Téléverser la photo
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
                <TextInput
                  name="categorie"
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
      </PageShell>
    </>
  );
}
