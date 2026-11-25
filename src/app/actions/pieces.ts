"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export type CreatedPiece = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number | null;
  photo_url: string | null;
  notes: string | null;
};

export type PieceActionState = {
  error: string | null;
  /** Set on successful create — client updates list without RSC revalidate. */
  createdId?: string | null;
  created?: CreatedPiece | null;
  photoWarning?: string | null;
};

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

function friendlyDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("relation") && lower.includes("does not exist")) {
    return "La table « pieces » n’existe pas encore. Réexécutez docs/sql/schema.sql dans Supabase.";
  }
  if (
    lower.includes("row-level security") ||
    lower.includes("rls") ||
    lower.includes("new row violates")
  ) {
    return "Accès refusé par RLS. Vérifiez SUPABASE_SERVICE_ROLE_KEY et docs/sql/schema.sql.";
  }
  if (lower.includes("invalid api key") || lower.includes("jwt")) {
    return "Clé Supabase invalide. Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.";
  }
  if (lower.includes("permission denied") || lower.includes("42501")) {
    return "Permission refusée sur « pieces ». Vérifiez le rôle service et RLS.";
  }
  if (lower.includes("bucket") || lower.includes("not found")) {
    return "Bucket Storage « photos-pieces » introuvable ou inaccessible.";
  }
  // Never surface raw Postgres/PostgREST strings to the UI.
  return "Erreur base de données. Réessayez ou vérifiez la configuration Supabase.";
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
  const type = file.type;
  if (!type || !ALLOWED_PHOTO_TYPES.has(type)) {
    throw new Error("Format d’image non supporté (JPEG, PNG, WebP ou GIF).");
  }

  const ext =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const path = `${pieceId}/${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const supabase = createServiceClient();
  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_PIECES_BUCKET)
    .upload(path, bytes, {
      contentType: type,
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTOS_PIECES_BUCKET).getPublicUrl(path);

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
  try {
    if (!hasSupabaseEnv()) {
      return {
        error:
          "Connexion Supabase absente. Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      };
    }

    const nom = String(formData.get("nom") ?? "").trim();
    if (!nom) {
      return { error: "Le nom est obligatoire." };
    }

    const categorie = emptyToNull(formData.get("categorie"));
    const stock_total = Number(formData.get("stock_total") || 0);
    const notes = emptyToNull(formData.get("notes"));

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("pieces")
      .insert({
        nom,
        categorie,
        stock_total,
        notes,
      })
      .select("id, nom, categorie, stock_total, photo_url, notes")
      .single();

    if (error || !data) {
      return {
        error: friendlyDbError(error?.message ?? "Échec de l’enregistrement."),
      };
    }

    let photoWarning: string | null = null;
    let photo_url =
      typeof data.photo_url === "string" ? data.photo_url : null;
    const photo = getPhotoFile(formData);
    if (photo) {
      try {
        photo_url = await storePiecePhoto(data.id, photo);
      } catch (err) {
        photoWarning = friendlyDbError(
          err instanceof Error ? err.message : "Échec du téléversement photo.",
        );
      }
    }

    const created: CreatedPiece = {
      id: String(data.id),
      nom: String(data.nom ?? nom),
      categorie:
        typeof data.categorie === "string" ? data.categorie : categorie,
      stock_total:
        typeof data.stock_total === "number" ? data.stock_total : stock_total,
      photo_url,
      notes: typeof data.notes === "string" ? data.notes : notes,
    };

    return { error: null, createdId: created.id, created, photoWarning };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    return { error: friendlyDbError(message) };
  }
}

export async function updatePiece(
  pieceId: string,
  _prev: PieceActionState,
  formData: FormData,
): Promise<PieceActionState> {
  try {
    if (!hasSupabaseEnv()) {
      return { error: "Connexion Supabase absente." };
    }

    const nom = String(formData.get("nom") ?? "").trim();
    if (!nom) return { error: "Le nom est obligatoire." };

    const supabase = createServiceClient();
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

    revalidatePath("/pieces");
    revalidatePath(`/pieces/${pieceId}`);
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    return { error: friendlyDbError(message) };
  }
}

export async function deletePiece(pieceId: string): Promise<void> {
  try {
    if (!hasSupabaseEnv()) {
      redirect("/pieces?error=" + encodeURIComponent("Connexion Supabase absente."));
    }
    const supabase = createServiceClient();
    const { error } = await supabase.from("pieces").delete().eq("id", pieceId);
    if (error) {
      redirect(
        "/pieces?error=" + encodeURIComponent(friendlyDbError(error.message)),
      );
    }
  } catch (err) {
    // redirect() throws — rethrow those; otherwise soft-fail to list.
    const digest = err && typeof err === "object" && "digest" in err
      ? String((err as { digest?: unknown }).digest)
      : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw err;
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    redirect("/pieces?error=" + encodeURIComponent(friendlyDbError(message)));
  }
  revalidatePath("/pieces");
  redirect("/pieces");
}

export async function uploadPiecePhoto(
  pieceId: string,
  _prev: PieceActionState,
  formData: FormData,
): Promise<PieceActionState> {
  try {
    const file = getPhotoFile(formData);
    if (!file) {
      return { error: "Choisissez une photo." };
    }
    await storePiecePhoto(pieceId, file);
    revalidatePath(`/pieces/${pieceId}`);
    revalidatePath("/pieces");
    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Échec du téléversement photo.";
    return { error: friendlyDbError(message) };
  }
}
