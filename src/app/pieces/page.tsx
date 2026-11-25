import Link from "next/link";
import { Plus } from "lucide-react";
import { createPieceForm } from "@/app/actions/pieces";
import { Button, Field, PageShell, TextArea, TextInput } from "@/components/ui";
import { loadTableRows } from "@/lib/supabase/load";
import { safeImageSrc } from "@/lib/safe-image-url";

export const dynamic = "force-dynamic";

type PieceRow = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number | null;
  photo_url: string | null;
  notes: string | null;
};

type Props = {
  searchParams: Promise<{
    error?: string;
    created?: string;
    warning?: string;
  }>;
};

function asPiece(row: Record<string, unknown>): PieceRow | null {
  const id = row.id;
  const nom = row.nom;
  if (typeof id !== "string" || typeof nom !== "string" || !nom.trim()) {
    return null;
  }
  return {
    id,
    nom,
    categorie: typeof row.categorie === "string" ? row.categorie : null,
    stock_total:
      typeof row.stock_total === "number"
        ? row.stock_total
        : row.stock_total == null
          ? 0
          : Number(row.stock_total) || 0,
    photo_url: typeof row.photo_url === "string" ? row.photo_url : null,
    notes: typeof row.notes === "string" ? row.notes : null,
  };
}

export default async function PiecesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const flashError =
    typeof sp.error === "string" && sp.error.trim() ? sp.error.trim() : null;
  const createdId =
    typeof sp.created === "string" && sp.created.trim()
      ? sp.created.trim()
      : null;
  const photoWarning =
    typeof sp.warning === "string" && sp.warning.trim()
      ? sp.warning.trim()
      : null;

  const { rows, errorMessage: rawLoadError } = await loadTableRows<
    Record<string, unknown>
  >((supabase) =>
    supabase
      .from("pieces")
      .select("id, nom, categorie, stock_total, photo_url, notes")
      .order("nom"),
  );
  const loadError = rawLoadError
    ? "Connexion ou requête Supabase impossible. Vérifiez les secrets et docs/sql/schema.sql."
    : null;

  const pieces = rows
    .map((row) => asPiece(row))
    .filter((row): row is PieceRow => row != null);

  return (
    <PageShell
      title="Pièces"
      description="Inventaire des pièces : nom, catégorie, stock total, photo et notes."
    >
      {flashError ? (
        <p
          role="alert"
          className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {flashError}
        </p>
      ) : null}

      {createdId ? (
        <p
          role="status"
          className="mb-6 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
        >
          {photoWarning
            ? `Pièce enregistrée (photo non téléversée : ${photoWarning}). `
            : "Pièce enregistrée dans Supabase. "}
          <Link
            href={`/pieces/${createdId}`}
            className="font-medium underline underline-offset-2"
          >
            Ouvrir la fiche
          </Link>
        </p>
      ) : null}

      {loadError ? (
        <p className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          Impossible de charger les pièces : {loadError}
        </p>
      ) : null}

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Nouvelle pièce
        </h2>
        <form
          action={createPieceForm}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
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
              list="pieces-categories"
            />
          </Field>
          <datalist id="pieces-categories">
            {Array.from(
              new Set(
                pieces
                  .map((p) => p.categorie?.trim())
                  .filter((c): c is string => Boolean(c)),
              ),
            ).map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
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
              <input
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900"
              />
            </Field>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit">
              <Plus className="mr-1.5 h-4 w-4" />
              Enregistrer la pièce
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Liste ({pieces.length})
        </h2>
        {pieces.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {loadError
              ? "Liste indisponible tant que la connexion échoue."
              : "Base vide — aucune pièce enregistrée."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Photo</th>
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 font-semibold">Stock total</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {pieces.map((piece) => {
                  const photo = safeImageSrc(piece.photo_url);
                  return (
                    <tr
                      key={piece.id}
                      className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/pieces/${piece.id}`} className="block">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photo}
                              alt=""
                              className="h-12 w-12 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-400 dark:bg-zinc-900">
                              —
                            </div>
                          )}
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
                      <td className="px-4 py-3 tabular-nums">
                        {piece.stock_total ?? 0}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-zinc-500">
                        {piece.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageShell>
  );
}
