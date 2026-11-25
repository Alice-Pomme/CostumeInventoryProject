"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyDbError } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { computeCommandePieceBesoins } from "@/lib/commande-demand";
import type { CommandeStatut, PieceBesoin } from "@/types/database";

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

export async function previewCommandeBesoins(input: {
  costumeId: string;
  quantiteCostumes: number;
  dateDebut: string;
  dateFin: string;
  excludeCommandeId?: string | null;
}): Promise<{ besoins: PieceBesoin[]; error?: string }> {
  return computeCommandePieceBesoins(input);
}

export async function createCommande(formData: FormData) {
  const supabase = await createClient();
  const clientNom = String(formData.get("client_nom") ?? "").trim();
  const costumeId = String(formData.get("costume_id") ?? "").trim();
  const quantite = Number(formData.get("quantite_costumes") || 0);
  const dateDebut = String(formData.get("date_debut") ?? "");
  const dateFin = String(formData.get("date_fin") ?? "");
  const statut = (emptyToNull(formData.get("statut")) ??
    "brouillon") as CommandeStatut;

  if (!clientNom) throw new Error("Le nom du client est obligatoire.");
  if (!costumeId) throw new Error("Choisissez un costume.");
  if (quantite < 1) throw new Error("La quantité doit être au moins 1.");
  if (!dateDebut || !dateFin) throw new Error("Les dates sont obligatoires.");
  if (dateFin < dateDebut) {
    throw new Error("La date de fin doit être après le début.");
  }

  const { data, error } = await supabase
    .from("commandes")
    .insert({
      client_nom: clientNom,
      costume_id: costumeId,
      quantite_costumes: quantite,
      date_debut: dateDebut,
      date_fin: dateFin,
      statut,
    })
    .select("id")
    .single();

  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePath("/commandes");
  redirect(`/commandes/${data.id}`);
}

export async function updateCommande(commandeId: string, formData: FormData) {
  const supabase = await createClient();
  const clientNom = String(formData.get("client_nom") ?? "").trim();
  const costumeId = String(formData.get("costume_id") ?? "").trim();
  const quantite = Number(formData.get("quantite_costumes") || 0);
  const dateDebut = String(formData.get("date_debut") ?? "");
  const dateFin = String(formData.get("date_fin") ?? "");
  const statut = (emptyToNull(formData.get("statut")) ??
    "brouillon") as CommandeStatut;

  if (!clientNom) throw new Error("Le nom du client est obligatoire.");
  if (!costumeId) throw new Error("Choisissez un costume.");
  if (quantite < 1) throw new Error("La quantité doit être au moins 1.");
  if (!dateDebut || !dateFin) throw new Error("Les dates sont obligatoires.");
  if (dateFin < dateDebut) {
    throw new Error("La date de fin doit être après le début.");
  }

  const { error } = await supabase
    .from("commandes")
    .update({
      client_nom: clientNom,
      costume_id: costumeId,
      quantite_costumes: quantite,
      date_debut: dateDebut,
      date_fin: dateFin,
      statut,
    })
    .eq("id", commandeId);

  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePath("/commandes");
  revalidatePath(`/commandes/${commandeId}`);
}

export async function deleteCommande(commandeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("commandes")
    .delete()
    .eq("id", commandeId);
  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePath("/commandes");
  redirect("/commandes");
}
