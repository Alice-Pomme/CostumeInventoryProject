import { createClient } from "@/lib/supabase/server";
import {
  buildPieceBesoins,
  consolidatePieceNeeds,
  datesOverlap,
} from "@/lib/availability";
import {
  COMMANDE_STATUTS_RESERVANT,
  type PieceBesoin,
} from "@/types/database";

export type DemandPreviewInput = {
  costumeId: string;
  quantiteCostumes: number;
  dateDebut: string;
  dateFin: string;
  excludeCommandeId?: string | null;
};

export async function computeCommandePieceBesoins(
  input: DemandPreviewInput,
): Promise<{ besoins: PieceBesoin[]; error?: string }> {
  if (!input.costumeId || !input.dateDebut || !input.dateFin) {
    return { besoins: [], error: "Costume et dates requis." };
  }
  if (input.dateFin < input.dateDebut) {
    return { besoins: [], error: "La date de fin doit être après le début." };
  }

  const supabase = await createClient();

  const { data: links, error: linksError } = await supabase
    .from("costume_pieces")
    .select("piece_id, quantite_par_costume")
    .eq("costume_id", input.costumeId);

  if (linksError) return { besoins: [], error: linksError.message };
  if (!links?.length) {
    return {
      besoins: [],
      error: "Ce costume n’a aucune pièce liée.",
    };
  }

  const quantiteParCostume = new Map<string, number>();
  for (const link of links) {
    quantiteParCostume.set(
      link.piece_id,
      (quantiteParCostume.get(link.piece_id) ?? 0) +
        Number(link.quantite_par_costume ?? 1),
    );
  }

  const besoinCommande = consolidatePieceNeeds(
    links,
    input.quantiteCostumes,
  );

  const { data: autres, error: cmdError } = await supabase
    .from("commandes")
    .select("id, costume_id, quantite_costumes, date_debut, date_fin, statut")
    .not("statut", "eq", "annulee")
    .not("statut", "eq", "terminee");

  if (cmdError) return { besoins: [], error: cmdError.message };

  const overlapping = (autres ?? []).filter((c) => {
    if (input.excludeCommandeId && c.id === input.excludeCommandeId) {
      return false;
    }
    if (!c.costume_id || !c.date_debut || !c.date_fin) return false;
    const statut = (c.statut ?? "brouillon") as (typeof COMMANDE_STATUTS_RESERVANT)[number];
    if (!COMMANDE_STATUTS_RESERVANT.includes(statut)) return false;
    return datesOverlap(
      input.dateDebut,
      input.dateFin,
      c.date_debut,
      c.date_fin,
    );
  });

  const reserveAutres = new Map<string, number>();
  if (overlapping.length > 0) {
    const costumeIds = [
      ...new Set(overlapping.map((c) => c.costume_id!).filter(Boolean)),
    ];
    const { data: otherLinks, error: olError } = await supabase
      .from("costume_pieces")
      .select("costume_id, piece_id, quantite_par_costume")
      .in("costume_id", costumeIds);

    if (olError) return { besoins: [], error: olError.message };

    const linksByCostume = new Map<
      string,
      { piece_id: string; quantite_par_costume: number | null }[]
    >();
    for (const link of otherLinks ?? []) {
      const list = linksByCostume.get(link.costume_id) ?? [];
      list.push(link);
      linksByCostume.set(link.costume_id, list);
    }

    for (const cmd of overlapping) {
      const cmdLinks = linksByCostume.get(cmd.costume_id!) ?? [];
      const needs = consolidatePieceNeeds(
        cmdLinks,
        Number(cmd.quantite_costumes ?? 0),
      );
      for (const [pieceId, qty] of needs) {
        reserveAutres.set(pieceId, (reserveAutres.get(pieceId) ?? 0) + qty);
      }
    }
  }

  const pieceIds = [
    ...new Set([...besoinCommande.keys(), ...reserveAutres.keys()]),
  ];
  const { data: pieces, error: piecesError } = await supabase
    .from("pieces")
    .select("id, nom, categorie, stock_total")
    .in("id", pieceIds);

  if (piecesError) return { besoins: [], error: piecesError.message };

  return {
    besoins: buildPieceBesoins({
      besoinCommande,
      reserveAutres,
      pieces: pieces ?? [],
      quantiteParCostume,
    }),
  };
}
