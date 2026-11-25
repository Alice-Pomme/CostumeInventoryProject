export const instant = false;

import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createPiece } from "@/app/actions/pieces";
import { AppNav } from "@/components/AppNav";
import { Button, Field, PageShell, TextArea, TextInput } from "@/components/ui";

export default async function PiecesPage() {
  const supabase = await createClient();
  const { data: pieces, error } = await supabase
    .from("pieces")
    .select("id, nom, categorie, stock_total, photo_url, notes")
    .order("nom");

  return (
    <>
      <AppNav />
      <PageShell
        title="Pièces"
        description="Gérer les pièces individuelles de costume."
      >
        {error ? (
          <p className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            Impossible de charger les pièces : {error.message}
          </p>
        ) : null}

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Nouvelle pièce
          </h2>
          <form
            action={createPiece}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Field label="Nom *">
              <TextInput name="nom" required placeholder="Ex. Chemise blanche" />
            </Field>
            <Field label="Catégorie">
              <TextInput name="categorie" placeholder="Ex. Haut" />
            </Field>
            <Field label="Stock total">
              <TextInput
                name="stock_total"
                type="number"
                min={0}
                defaultValue={1}
              />
            </Field>
            <Field label="Notes">
              <TextArea name="notes" placeholder="Notes optionnelles" />
            </Field>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit">
                <Plus className="mr-1.5 h-4 w-4" />
                Ajouter la pièce
              </Button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Inventaire ({pieces?.length ?? 0})
          </h2>
          {!pieces?.length ? (
            <p className="text-sm text-zinc-500">Aucune pièce pour le moment.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {pieces.map((piece) => (
                <li key={piece.id}>
                  <Link
                    href={`/pieces/${piece.id}`}
                    className="flex items-center gap-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    {piece.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={piece.photo_url}
                        alt=""
                        className="h-14 w-14 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-900">
                        Photo
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {piece.nom}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {piece.categorie || "Sans catégorie"} · stock{" "}
                        {piece.stock_total ?? 0}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageShell>
    </>
  );
}
