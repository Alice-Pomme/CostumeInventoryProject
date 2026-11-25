"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

/**
 * Minimal create action — mirrors createCostume (redirect on success/failure).
 * Kept in its own file so /pieces does not pull in photo/storage code.
 */
export async function createPieceForm(formData: FormData): Promise<void> {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Connexion Supabase absente. Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) throw new Error("Le nom est obligatoire.");

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("pieces")
    .insert({
      nom,
      categorie: emptyToNull(formData.get("categorie")),
      stock_total: Number(formData.get("stock_total") || 0),
      notes: emptyToNull(formData.get("notes")),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Échec de l’enregistrement.");
  }

  redirect(`/pieces/${data.id}`);
}
