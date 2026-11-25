export const instant = false;

import { connection } from "next/server";
import { AppNav } from "@/components/AppNav";
import { PiecesInventory, type PieceRow } from "@/components/PiecesInventory";
import { PageShell } from "@/components/ui";
import { createServiceClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

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

function sanitizePiece(row: Record<string, unknown>): PieceRow | null {
  if (typeof row.id !== "string" || typeof row.nom !== "string") return null;
  return {
    id: row.id,
    nom: row.nom,
    categorie: typeof row.categorie === "string" ? row.categorie : null,
    stock_total:
      typeof row.stock_total === "number"
        ? row.stock_total
        : row.stock_total == null
          ? null
          : Number(row.stock_total) || 0,
    photo_url: typeof row.photo_url === "string" ? row.photo_url : null,
    notes: typeof row.notes === "string" ? row.notes : null,
  };
}

export default async function PiecesPage() {
  await connection();

  let pieces: PieceRow[] = [];
  let errorMessage: string | null = null;

  try {
    if (hasSupabaseEnv()) {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("pieces")
        .select("id, nom, categorie, stock_total, photo_url, notes")
        .order("nom");
      if (error) {
        errorMessage = String(error.message || "Erreur Supabase");
      } else {
        pieces = (data ?? [])
          .map((row) => sanitizePiece(row as Record<string, unknown>))
          .filter((row): row is PieceRow => row != null);
      }
    }
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Erreur inattendue au chargement.";
    console.error("PiecesPage load failed:", err);
  }

  // Guaranteed plain JSON for the client boundary.
  const safePieces = JSON.parse(JSON.stringify(pieces)) as PieceRow[];
  const safeCategories = categoriesFromPieces(safePieces);

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

        <PiecesInventory pieces={safePieces} categories={safeCategories} />
      </PageShell>
    </>
  );
}
