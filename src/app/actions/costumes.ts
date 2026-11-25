"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyDbError } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { sanitizeStoredImageUrl } from "@/lib/safe-image-url";

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

function photoUrlFromForm(formData: FormData): string | null {
  const raw = emptyToNull(formData.get("photo_url"));
  if (!raw) return null;
  const safe = sanitizeStoredImageUrl(raw);
  if (!safe) {
    throw new Error("URL photo invalide — utilisez une adresse https.");
  }
  return safe;
}

export async function createCostume(formData: FormData) {
  const supabase = await createClient();
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) throw new Error("Le nom est obligatoire.");

  const { data, error } = await supabase
    .from("costumes")
    .insert({
      nom,
      theme: emptyToNull(formData.get("theme")),
      description: emptyToNull(formData.get("description")),
      photo_url: photoUrlFromForm(formData),
    })
    .select("id")
    .single();

  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePath("/costumes");
  redirect(`/costumes/${data.id}`);
}

export async function updateCostume(costumeId: string, formData: FormData) {
  const supabase = await createClient();
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) throw new Error("Le nom est obligatoire.");

  const { error } = await supabase
    .from("costumes")
    .update({
      nom,
      theme: emptyToNull(formData.get("theme")),
      description: emptyToNull(formData.get("description")),
      photo_url: photoUrlFromForm(formData),
    })
    .eq("id", costumeId);

  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePath("/costumes");
  revalidatePath(`/costumes/${costumeId}`);
}

export async function deleteCostume(costumeId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("costumes").delete().eq("id", costumeId);
  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePath("/costumes");
  redirect("/costumes");
}

export async function addPieceToCostume(costumeId: string, formData: FormData) {
  const supabase = await createClient();
  const pieceId = String(formData.get("piece_id") ?? "").trim();
  if (!pieceId) throw new Error("Choisissez une pièce.");

  const quantite = Number(formData.get("quantite_par_costume") || 1);

  const { data: existing } = await supabase
    .from("costume_pieces")
    .select("ordre_habillage")
    .eq("costume_id", costumeId)
    .order("ordre_habillage", { ascending: false })
    .limit(1);

  const nextOrder =
    existing && existing.length > 0
      ? Number(existing[0].ordre_habillage ?? 0) + 1
      : 1;

  const { error } = await supabase.from("costume_pieces").insert({
    costume_id: costumeId,
    piece_id: pieceId,
    quantite_par_costume: quantite,
    ordre_habillage: nextOrder,
  });

  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePath(`/costumes/${costumeId}`);
}

export async function updateCostumePiece(
  linkId: string,
  costumeId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const quantite = Number(formData.get("quantite_par_costume") || 1);
  const { error } = await supabase
    .from("costume_pieces")
    .update({ quantite_par_costume: quantite })
    .eq("id", linkId)
    .eq("costume_id", costumeId);

  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePath(`/costumes/${costumeId}`);
}

export async function removePieceFromCostume(linkId: string, costumeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("costume_pieces")
    .delete()
    .eq("id", linkId)
    .eq("costume_id", costumeId);

  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePath(`/costumes/${costumeId}`);
}

/** Persist 1-based ordre_habillage for every link in the costume. */
export async function reorderCostumePieces(
  costumeId: string,
  orderedLinkIds: string[],
) {
  const supabase = await createClient();

  const results = await Promise.all(
    orderedLinkIds.map((linkId, index) =>
      supabase
        .from("costume_pieces")
        .update({ ordre_habillage: index + 1 })
        .eq("id", linkId)
        .eq("costume_id", costumeId),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(friendlyDbError(failed.error.message));

  revalidatePath(`/costumes/${costumeId}`);
}
