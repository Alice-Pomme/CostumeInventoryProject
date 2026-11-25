import Link from "next/link";
import { NewPieceForm } from "@/components/NewPieceForm";
import { PageShell } from "@/components/ui";
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

function categoriesFrom(pieces: PieceRow[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of pieces) {
    const cat = p.categorie?.trim();
    if (!cat) continue;
    const key = cat.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cat);
  }
  return out;
}

export default async function PiecesPage() {
  let pieces: PieceRow[] = [];
  let errorMessage: string | null = null;

  try {
    const { rows, errorMessage: loadError } = await loadTableRows<
      Record<string, unknown>
    >((supabase) =>
      supabase
        .from("pieces")
        .select("id, nom, categorie, stock_total, photo_url, notes")
        .order("nom"),
    );
    errorMessage = loadError;
    pieces = rows
      .map((row) => asPiece(row))
      .filter((row): row is PieceRow => row != null);
  } catch (err) {
    console.error("PiecesPage load failed:", err);
    errorMessage =
      err instanceof Error ? err.message : "Erreur inattendue au chargement.";
  }

  const categories = categoriesFrom(pieces);

  return (
    <PageShell
      title="Pièces"
      description="Inventaire des pièces : nom, catégorie, stock total, photo et notes."
    >
      {errorMessage ? (
        <p className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          Impossible de charger les pièces : {errorMessage}
        </p>
      ) : null}

      <div className="mb-8">
        <NewPieceForm categories={categories} />
      </div>

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
            {pieces.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-16 text-center text-zinc-500"
                >
                  {errorMessage
                    ? "Liste indisponible tant que la connexion échoue."
                    : "Base vide — aucune pièce enregistrée."}
                </td>
              </tr>
            ) : (
              pieces.map((piece) => {
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
                    <td className="px-4 py-3 tabular-nums text-zinc-800 dark:text-zinc-200">
                      {piece.stock_total ?? 0}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-zinc-500">
                      {piece.notes || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
