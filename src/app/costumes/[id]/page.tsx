export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addPieceToCostume,
  deleteCostume,
  updateCostume,
} from "@/app/actions/costumes";
import { CostumePiecesEditor } from "@/components/CostumePiecesEditor";
import { AppNav } from "@/components/AppNav";
import {
  Button,
  Field,
  PageShell,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui";
import type { CostumePieceWithPiece } from "@/types/database";

type Props = { params: Promise<{ id: string }> };

export default async function CostumeDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: costume, error }, { data: links }, { data: allPieces }] =
    await Promise.all([
      supabase.from("costumes").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("costume_pieces")
        .select(
          "id, costume_id, piece_id, quantite_par_costume, ordre_habillage, created_at, pieces(id, nom, categorie, photo_url, stock_total)",
        )
        .eq("costume_id", id)
        .order("ordre_habillage", { ascending: true }),
      supabase.from("pieces").select("id, nom, categorie").order("nom"),
    ]);

  if (error) {
    return (
      <>
        <AppNav />
        <PageShell title="Costume">
          <p className="text-sm text-red-600">{error.message}</p>
        </PageShell>
      </>
    );
  }
  if (!costume) notFound();

  const linkedIds = new Set((links ?? []).map((l) => l.piece_id));
  const availablePieces = (allPieces ?? []).filter((p) => !linkedIds.has(p.id));
  const items = (links ?? []) as CostumePieceWithPiece[];

  return (
    <>
      <AppNav />
      <PageShell
        title={costume.nom}
        description="Modifier le costume et l’ordre d’habillage des pièces."
        actions={
          <Link
            href="/costumes"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            ← Retour aux costumes
          </Link>
        }
      >
        <section className="mb-10">
          <form
            action={updateCostume.bind(null, costume.id)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Field label="Nom *">
              <TextInput name="nom" required defaultValue={costume.nom} />
            </Field>
            <Field label="Thème">
              <TextInput name="theme" defaultValue={costume.theme ?? ""} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <TextArea
                  name="description"
                  defaultValue={costume.description ?? ""}
                />
              </Field>
            </div>
            <Field label="URL photo">
              <TextInput
                name="photo_url"
                defaultValue={costume.photo_url ?? ""}
              />
            </Field>
            <div className="flex items-end gap-2">
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
          <form action={deleteCostume.bind(null, costume.id)} className="mt-4">
            <Button type="submit" variant="danger">
              Supprimer le costume
            </Button>
          </form>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Pièces du costume
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            Glissez pour définir l’ordre d’habillage. Ajustez la quantité par
            costume.
          </p>
          <CostumePiecesEditor costumeId={costume.id} items={items} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Ajouter une pièce
          </h2>
          {availablePieces.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Toutes les pièces sont déjà liées, ou aucune pièce n’existe.{" "}
              <Link href="/pieces" className="underline">
                Créer une pièce
              </Link>
            </p>
          ) : (
            <form
              action={addPieceToCostume.bind(null, costume.id)}
              className="flex flex-wrap items-end gap-3"
            >
              <Field label="Pièce">
                <Select name="piece_id" required defaultValue="">
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {availablePieces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                      {p.categorie ? ` (${p.categorie})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Quantité par costume">
                <TextInput
                  name="quantite_par_costume"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="w-28"
                />
              </Field>
              <Button type="submit">Lier la pièce</Button>
            </form>
          )}
        </section>
      </PageShell>
    </>
  );
}
