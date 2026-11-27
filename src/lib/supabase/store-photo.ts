import "server-only";

import {
  classifySupabaseError,
  messageForFailCode,
} from "@/lib/supabase/classify-error";
import { createServiceClient } from "@/lib/supabase/admin";
import { PHOTOS_PIECES_BUCKET } from "@/types/database";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_PHOTOS_PER_FOLDER = 8;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

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

/**
 * Upload an image under folderPrefix/ in the private photos bucket.
 * Returns an authenticated app path `/api/piece-photo/...`.
 */
export async function storeInventoryPhoto(
  folderPrefix: string,
  file: File,
): Promise<string> {
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Image trop lourde (max. 8 Mo).");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageMime(bytes);
  if (!detected || !ALLOWED.has(detected)) {
    throw new Error("Format d’image non supporté (JPEG, PNG, WebP ou GIF).");
  }
  const ext =
    detected === "image/png"
      ? "png"
      : detected === "image/webp"
        ? "webp"
        : detected === "image/gif"
          ? "gif"
          : "jpg";
  const objectPath = `${folderPrefix}/${Date.now()}.${ext}`;
  const supabase = createServiceClient();

  const { data: existing, error: listError } = await supabase.storage
    .from(PHOTOS_PIECES_BUCKET)
    .list(folderPrefix, { limit: MAX_PHOTOS_PER_FOLDER + 1 });
  if (listError) {
    throw new Error(messageForFailCode(classifySupabaseError(listError.message)));
  }
  if ((existing?.length ?? 0) >= MAX_PHOTOS_PER_FOLDER) {
    throw new Error(
      `Limite de ${MAX_PHOTOS_PER_FOLDER} photos atteinte pour cet élément.`,
    );
  }

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_PIECES_BUCKET)
    .upload(objectPath, bytes, { contentType: detected, upsert: true });
  if (uploadError) {
    throw new Error(
      messageForFailCode(classifySupabaseError(uploadError.message)),
    );
  }

  return `/api/piece-photo/${objectPath}`;
}
