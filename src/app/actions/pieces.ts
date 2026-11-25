"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PHOTOS_PIECES_BUCKET } from "@/types/database";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type PieceActionState = {
  error: string | null;
};

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

function friendlyDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("relation") && lower.includes("does not exist")) {
    return "La table « pieces » n’existe pas encore dans Supabase. Exécutez docs/sql/schema.sql dans l’éditeur SQL, puis réessayez.";
  }
  if (lower.includes("row-level security") || lower.includes("rls")) {
    return "Insertion refusée par les politiques RLS Supabase. Autorisez INSERT/SELECT pour le rôle anon sur « pieces ».";
  }
  if (lower.includes("permission denied") || lower.includes("42501")) {
    return "Permission refusée sur « pieces ». Vérifiez les droits et les politiques RLS.";
  }
  if (lower.includes("bucket") || lower.includes("not found")) {
    return "Bucket Storage « photos-pieces » introuvable ou inaccessible.";
  }
  return message;
}

function getPhotoFile(formData: FormData): File | null {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return null;
  return photo;
}

async function storePiecePhoto(pieceId: string, file: File): Promise<string> {
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Image trop lourde (max. 8 Mo).");
  }
  const type = file.type || "image/jpeg";
  if (!ALLOWED_PHOTO_TYPES.has(type) && !type.startsWith("image/")) {
    throw new Error("Format d’image non supporté.");
  }

  const ext =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const path = `${pieceId}/${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const storage = createServiceClient();
  const { error: uploadError } = await storage.storage
    .from(PHOTOS_PIECES_BUCKET)
    .upload(path, bytes, {
      contentType: type,
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = storage.storage.from(PHOTOS_PIECES_BUCKET).getPublicUrl(path);

  const supabase = await createClient();
  const { error } = await supabase
    .from("pieces")
    .update({ photo_url: publicUrl })
    .eq("id", pieceId);

  if (error) throw new Error(error.message);
  return publicUrl;
}

export async function createPiece(
  _prev: PieceActionState,
  formData: FormData,
): Promise<PieceActionState> {
  if (!hasSupabaseEnv()) {
    return {
      error:
        "Connexion Supabase absente. Vérifiez les secrets SUPABASE_URL et SUPABASE_ANON_KEY.",
    };
  }

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) {
    return { error: "Le nom est obligatoire." };
  }

  let pieceId: string;
  try {
    const supabase = await createClient();
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
      return {
        error: friendlyDbError(error?.message ?? "Échec de l’enregistrement."),
      };
    }
    pieceId = data.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    return { error: friendlyDbError(message) };
  }

  const photo = getPhotoFile(formData);
  if (photo) {
    try {
      await storePiecePhoto(pieceId, photo);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Échec du téléversement photo.";
      // Piece row exists — send user to detail with a photo warning.
      revalidatePath("/pieces");
      redirect(
        `/pieces/${pieceId}?photoError=${encodeURIComponent(friendlyDbError(message))}`,
      );
    }
  }

  revalidatePath("/pieces");
  redirect(`/pieces/${pieceId}`);
}

export async function updatePiece(
  pieceId: string,
  _prev: PieceActionState,
  formData: FormData,
): Promise<PieceActionState> {
  if (!hasSupabaseEnv()) {
    return { error: "Connexion Supabase absente." };
  }

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return { error: "Le nom est obligatoire." };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("pieces")
      .update({
        nom,
        categorie: emptyToNull(formData.get("categorie")),
        stock_total: Number(formData.get("stock_total") || 0),
        notes: emptyToNull(formData.get("notes")),
      })
      .eq("id", pieceId);

    if (error) {
      return { error: friendlyDbError(error.message) };
    }

    const photo = getPhotoFile(formData);
    if (photo) {
      try {
        await storePiecePhoto(pieceId, photo);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Échec du téléversement photo.";
        return { error: friendlyDbError(message) };
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    return { error: friendlyDbError(message) };
  }

  revalidatePath("/pieces");
  revalidatePath(`/pieces/${pieceId}`);
  return { error: null };
}

export async function deletePiece(pieceId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pieces").delete().eq("id", pieceId);
  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePath("/pieces");
  redirect("/pieces");
}

export async function uploadPiecePhoto(
  pieceId: string,
  _prev: PieceActionState,
  formData: FormData,
): Promise<PieceActionState> {
  const file = getPhotoFile(formData);
  if (!file) {
    return { error: "Choisissez une photo." };
  }
  try {
    await storePiecePhoto(pieceId, file);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Échec du téléversement photo.";
    return { error: friendlyDbError(message) };
  }
  revalidatePath(`/pieces/${pieceId}`);
  revalidatePath("/pieces");
  return { error: null };
}
