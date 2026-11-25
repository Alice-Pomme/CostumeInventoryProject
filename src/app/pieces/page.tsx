export const instant = false;

import { AppNav } from "@/components/AppNav";
import { PiecesInventory } from "@/components/PiecesInventory";
import { PageShell } from "@/components/ui";
import { loadTableRows } from "@/lib/supabase/load";

type PieceRow = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number | null;
  photo_url: string | null;
  notes: string | null;
};

function categoriesFromPieces(pieces: PieceRow[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const piece of pieces) {
    const cat = piece.categorie?.trim();
    if (!cat) continue;
    const key = cat.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cat);
  }
  return out;
}

export default async function PiecesPage() {
  const { rows: pieces, errorMessage } = await loadTableRows<PieceRow>(
    (supabase) =>
      supabase
        .from("pieces")
        .select("id, nom, categorie, stock_total, photo_url, notes")
        .order("nom"),
  );

  return (
    <>
      <AppNav />
      <PageShell
        title="Pièces"
        description="Inventaire des pièces : nom, catégorie, stock total, photo et notes."
      >
        {errorMessage ? (
          <p className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            Impossible de charger les pièces : {errorMessage}
          </p>
        ) : null}

        <PiecesInventory
          pieces={pieces}
          categories={categoriesFromPieces(pieces)}
        />
      </PageShell>
    </>
  );
}
