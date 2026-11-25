import type { PieceBesoin } from "@/types/database";

/** Inclusive date ranges overlap when startA <= endB && startB <= endA. */
export function datesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA <= endB && startB <= endA;
}

export function consolidatePieceNeeds(
  links: { piece_id: string; quantite_par_costume: number | null }[],
  quantiteCostumes: number,
): Map<string, number> {
  const needs = new Map<string, number>();
  const qty = Math.max(0, quantiteCostumes);
  for (const link of links) {
    const perCostume = Number(link.quantite_par_costume ?? 1);
    const add = perCostume * qty;
    needs.set(link.piece_id, (needs.get(link.piece_id) ?? 0) + add);
  }
  return needs;
}

export function buildPieceBesoins(args: {
  besoinCommande: Map<string, number>;
  reserveAutres: Map<string, number>;
  pieces: {
    id: string;
    nom: string;
    categorie: string | null;
    stock_total: number | null;
  }[];
  quantiteParCostume: Map<string, number>;
}): PieceBesoin[] {
  const pieceIds = new Set([
    ...args.besoinCommande.keys(),
    ...args.reserveAutres.keys(),
  ]);

  const byId = new Map(args.pieces.map((p) => [p.id, p]));

  const rows: PieceBesoin[] = [];
  for (const pieceId of pieceIds) {
    const piece = byId.get(pieceId);
    if (!piece) continue;
    const stock = Number(piece.stock_total ?? 0);
    const besoin = args.besoinCommande.get(pieceId) ?? 0;
    const reserve = args.reserveAutres.get(pieceId) ?? 0;
    const total = besoin + reserve;
    const disponible = stock - reserve;
    const manque = Math.max(0, besoin - Math.max(0, disponible));
    rows.push({
      piece_id: pieceId,
      nom: piece.nom,
      categorie: piece.categorie,
      stock_total: stock,
      quantite_par_costume: args.quantiteParCostume.get(pieceId) ?? 0,
      besoin_commande: besoin,
      reserve_autres: reserve,
      total_demande: total,
      disponible: Math.max(0, disponible),
      manque,
      en_rupture: manque > 0,
    });
  }

  return rows.sort((a, b) => {
    if (a.en_rupture !== b.en_rupture) return a.en_rupture ? -1 : 1;
    return a.nom.localeCompare(b.nom, "fr");
  });
}
