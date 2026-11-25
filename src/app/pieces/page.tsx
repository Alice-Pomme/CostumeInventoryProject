import Link from "next/link";
import { Plus } from "lucide-react";
import { createPieceForm } from "@/app/actions/create-piece";
import { AppNav } from "@/components/AppNav";
import { Button, Field, PageShell, TextArea, TextInput } from "@/components/ui";
import { loadTableRows } from "@/lib/supabase/load";

type PieceRow = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number;
  notes: string | null;
};

function isNextControlError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const digest =
    "digest" in err ? String((err as { digest?: unknown }).digest) : "";
  return (
    digest === "DYNAMIC_SERVER_USAGE" ||
    digest.startsWith("NEXT_") ||
    digest.startsWith("PRIMETIME_") ||
    digest.startsWith("BAILOUT_")
  );
}

function toPiece(row: unknown): PieceRow | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = r.id == null ? "" : String(r.id);
  const nom = r.nom == null ? "" : String(r.nom);
  if (!id || !nom.trim()) return null;
  const stockRaw = r.stock_total;
  const stock_total =
    typeof stockRaw === "number"
      ? stockRaw
      : stockRaw == null
        ? 0
        : Number(stockRaw) || 0;
  return {
    id,
    nom,
    categorie:
      typeof r.categorie === "string"
        ? r.categorie
        : r.categorie == null
          ? null
          : String(r.categorie),
    stock_total,
    notes:
      typeof r.notes === "string"
        ? r.notes
        : r.notes == null
          ? null
          : String(r.notes),
  };
}

export default async function PiecesPage() {
  // Do not catch connection()/DYNAMIC_SERVER_USAGE — that bailout must propagate
  // so Next can mark the route dynamic (catching it caused host “couldn't load”).
  const loaded = await loadTableRows<Record<string, unknown>>((supabase) =>
    supabase
      .from("pieces")
      .select("id, nom, categorie, stock_total, notes")
      .order("nom"),
  );

  let pieces: PieceRow[] = [];
  try {
    const plain = JSON.parse(JSON.stringify(loaded.rows ?? [])) as unknown[];
    pieces = plain.map(toPiece).filter((p): p is PieceRow => p != null);
  } catch (err) {
    if (isNextControlError(err)) throw err;
    console.error("PiecesPage sanitize failed:", err);
    pieces = [];
  }

  const loadFailed = Boolean(loaded.errorMessage);

  return (
    <>
      <AppNav />
      <PageShell
        title="Pièces"
        description="Inventaire des pièces : nom, catégorie, stock total et notes."
      >
        {loadFailed ? (
          <p className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            Impossible de charger les pièces. Vérifiez Supabase (secrets +
            schema.sql).
          </p>
        ) : null}

        <section className="mb-10">
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
            Liste ({pieces.length})
          </h2>
          {pieces.length === 0 ? (
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
                      {piece.notes
                        ? ` · ${piece.notes.slice(0, 80)}`
                        : ""}
                    </p>
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
