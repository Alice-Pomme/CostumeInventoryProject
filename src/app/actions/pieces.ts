"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { PHOTOS_PIECES_BUCKET } from "@/types/database";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

async function storePiecePhoto(pieceId: string, file: File): Promise<string> {
  if (file.size === 0) {
    throw new Error("Choisissez une photo.");
  }
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

export async function createPiece(formData: FormData) {
  const supabase = await createClient();
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) {
    throw new Error("Le nom est obligatoire.");
  }

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

  if (error) throw new Error(error.message);

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    await storePiecePhoto(data.id, photo);
  }

  revalidatePath("/pieces");
  redirect(`/pieces/${data.id}`);
}

export async function updatePiece(pieceId: string, formData: FormData) {
  const supabase = await createClient();
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) throw new Error("Le nom est obligatoire.");

  const { error } = await supabase
    .from("pieces")
    .update({
      nom,
      categorie: emptyToNull(formData.get("categorie")),
      stock_total: Number(formData.get("stock_total") || 0),
      notes: emptyToNull(formData.get("notes")),
    })
    .eq("id", pieceId);

  if (error) throw new Error(error.message);

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    await storePiecePhoto(pieceId, photo);
  }

  revalidatePath("/pieces");
  revalidatePath(`/pieces/${pieceId}`);
}

export async function deletePiece(pieceId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pieces").delete().eq("id", pieceId);
  if (error) throw new Error(error.message);
  revalidatePath("/pieces");
  redirect("/pieces");
}

export async function uploadPiecePhoto(pieceId: string, formData: FormData) {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choisissez une photo.");
  }
  await storePiecePhoto(pieceId, file);
  revalidatePath(`/pieces/${pieceId}`);
  revalidatePath("/pieces");
}
