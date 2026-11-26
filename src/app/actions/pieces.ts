"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  requireViewer,
  unauthorizedMessage,
} from "@/lib/auth/require-viewer";
import { friendlyDbError } from "@/lib/db-errors";
import { createServiceClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PHOTOS_PIECES_BUCKET } from "@/types/database";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_PHOTOS_PER_PIECE = 8;
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

function getPhotoFile(formData: FormData): File | null {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return null;
  return photo;
}

function detectImageMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x39 || bytes[4] === 0x37) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }
  return null;
}

async function storePiecePhoto(pieceId: string, file: File): Promise<string> {
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Image trop lourde (max. 8 Mo).");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageMime(bytes);
  if (!detected || !ALLOWED_PHOTO_TYPES.has(detected)) {
    throw new Error("Format d’image non supporté (JPEG, PNG, WebP ou GIF).");
  }
  // Browser MIME is advisory only — trust magic bytes.
  if (file.type && file.type !== detected && ALLOWED_PHOTO_TYPES.has(file.type)) {
    // Mismatch is OK if both are allowed images; still store as detected.
  }

  const ext =
    detected === "image/png"
      ? "png"
      : detected === "image/webp"
        ? "webp"
        : detected === "image/gif"
          ? "gif"
          : "jpg";
  const objectPath = `${pieceId}/${Date.now()}.${ext}`;

  const supabase = createServiceClient();

  const { data: existing, error: listError } = await supabase.storage
    .from(PHOTOS_PIECES_BUCKET)
    .list(pieceId, { limit: MAX_PHOTOS_PER_PIECE + 1 });
  if (listError) {
    throw new Error(friendlyDbError(listError.message));
  }
  if ((existing?.length ?? 0) >= MAX_PHOTOS_PER_PIECE) {
    throw new Error(
      `Limite de ${MAX_PHOTOS_PER_PIECE} photos atteinte pour cette pièce.`,
    );
  }

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_PIECES_BUCKET)
    .upload(objectPath, bytes, {
      contentType: detected,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(friendlyDbError(uploadError.message));
  }

  // Private bucket — serve via authenticated proxy, not a public URL.
  const appPath = `/api/piece-photo/${objectPath}`;

  const { error } = await supabase
    .from("pieces")
    .update({ photo_url: appPath })
    .eq("id", pieceId);

  if (error) throw new Error(friendlyDbError(error.message));
  return appPath;
}

export async function createPiece(
  _prev: PieceActionState,
  formData: FormData,
): Promise<PieceActionState> {
  try {
    await requireViewer();
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
        photoWarning =
          err instanceof Error
            ? err.message
            : "Échec du téléversement photo.";
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
    return { error: unauthorizedMessage(err) };
  }
}

export async function updatePiece(
  pieceId: string,
  _prev: PieceActionState,
  formData: FormData,
): Promise<PieceActionState> {
  try {
    await requireViewer();
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
        return { error: message };
      }
    }

    revalidatePath("/pieces");
    revalidatePath(`/pieces/${pieceId}`);
    return { error: null };
  } catch (err) {
    return { error: unauthorizedMessage(err) };
  }
}

export async function deletePiece(pieceId: string): Promise<void> {
  try {
    await requireViewer();
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
    const digest =
      err && typeof err === "object" && "digest" in err
        ? String((err as { digest?: unknown }).digest)
        : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw err;
    redirect(
      "/pieces?error=" + encodeURIComponent(unauthorizedMessage(err)),
    );
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
    await requireViewer();
    const file = getPhotoFile(formData);
    if (!file) {
      return { error: "Choisissez une photo." };
    }
    await storePiecePhoto(pieceId, file);
    revalidatePath(`/pieces/${pieceId}`);
    revalidatePath("/pieces");
    return { error: null };
  } catch (err) {
    return { error: unauthorizedMessage(err) };
  }
}
