import { NextResponse } from "next/server";
import { requireViewerOrResponse } from "@/lib/auth/require-viewer";
import {
  classifySupabaseError,
  messageForFailCode,
} from "@/lib/supabase/classify-error";
import { createServiceClient } from "@/lib/supabase/admin";
import { getSupabaseUrl, hasSupabaseEnv } from "@/lib/supabase/env";
import { PHOTOS_PIECES_BUCKET } from "@/types/database";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_PHOTOS_PER_PIECE = 8;
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type PieceDto = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number;
  notes: string | null;
  photo_url: string | null;
};

function hostLabel(): string | null {
  const url = getSupabaseUrl();
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

function toPiece(row: Record<string, unknown>): PieceDto | null {
  const id = row.id == null ? "" : String(row.id);
  const nom = row.nom == null ? "" : String(row.nom);
  if (!id || !nom.trim()) return null;
  const stockRaw = row.stock_total;
  return {
    id,
    nom,
    categorie:
      typeof row.categorie === "string"
        ? row.categorie
        : row.categorie == null
          ? null
          : String(row.categorie),
    stock_total:
      typeof stockRaw === "number"
        ? stockRaw
        : stockRaw == null
          ? 0
          : Number(stockRaw) || 0,
    notes:
      typeof row.notes === "string"
        ? row.notes
        : row.notes == null
          ? null
          : String(row.notes),
    photo_url:
      typeof row.photo_url === "string"
        ? row.photo_url
        : row.photo_url == null
          ? null
          : String(row.photo_url),
  };
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

async function storePiecePhoto(
  pieceId: string,
  file: File,
): Promise<string> {
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Image trop lourde (max. 8 Mo).");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageMime(bytes);
  if (!detected || !ALLOWED_PHOTO_TYPES.has(detected)) {
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
  const objectPath = `${pieceId}/${Date.now()}.${ext}`;
  const supabase = createServiceClient();

  const { data: existing, error: listError } = await supabase.storage
    .from(PHOTOS_PIECES_BUCKET)
    .list(pieceId, { limit: MAX_PHOTOS_PER_PIECE + 1 });
  if (listError) throw new Error(messageForFailCode(classifySupabaseError(listError.message)));
  if ((existing?.length ?? 0) >= MAX_PHOTOS_PER_PIECE) {
    throw new Error(
      `Limite de ${MAX_PHOTOS_PER_PIECE} photos atteinte pour cette pièce.`,
    );
  }

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_PIECES_BUCKET)
    .upload(objectPath, bytes, { contentType: detected, upsert: true });
  if (uploadError) {
    throw new Error(messageForFailCode(classifySupabaseError(uploadError.message)));
  }

  const appPath = `/api/piece-photo/${objectPath}`;
  const { error } = await supabase
    .from("pieces")
    .update({ photo_url: appPath })
    .eq("id", pieceId);
  if (error) {
    throw new Error(messageForFailCode(classifySupabaseError(error.message)));
  }
  return appPath;
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Ctx) {
  const identity = await requireViewerOrResponse(request);
  if (identity instanceof Response) {
    return NextResponse.json(
      { ok: false, message: "Connexion Cursor requise." },
      { status: 401, headers: NO_STORE },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { ok: false, message: messageForFailCode("not_configured"), host: hostLabel() },
      { status: 503, headers: NO_STORE },
    );
  }

  const { id } = await context.params;
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("pieces")
      .select("id, nom, categorie, stock_total, photo_url, notes")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      const code = classifySupabaseError(error.message);
      return NextResponse.json(
        { ok: false, message: messageForFailCode(code), host: hostLabel() },
        { status: 502, headers: NO_STORE },
      );
    }
    if (!data) {
      return NextResponse.json(
        { ok: false, message: "Pièce introuvable." },
        { status: 404, headers: NO_STORE },
      );
    }

    const piece = toPiece(data as Record<string, unknown>);
    const { data: cats } = await supabase.from("pieces").select("categorie");
    const categories = [
      ...new Set(
        (cats ?? [])
          .map((r) => (typeof r.categorie === "string" ? r.categorie.trim() : ""))
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

    return NextResponse.json(
      { ok: true, piece, categories, host: hostLabel() },
      { headers: NO_STORE },
    );
  } catch (err) {
    console.error("GET /api/pieces/[id] threw:", err);
    return NextResponse.json(
      { ok: false, message: messageForFailCode("unexpected") },
      { status: 500, headers: NO_STORE },
    );
  }
}

export async function PATCH(request: Request, context: Ctx) {
  const identity = await requireViewerOrResponse(request);
  if (identity instanceof Response) {
    return NextResponse.json(
      { ok: false, message: "Connexion Cursor requise." },
      { status: 401, headers: NO_STORE },
    );
  }
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { ok: false, message: messageForFailCode("not_configured") },
      { status: 503, headers: NO_STORE },
    );
  }

  const { id } = await context.params;
  try {
    const formData = await request.formData();
    const nom = String(formData.get("nom") ?? "").trim();
    if (!nom) {
      return NextResponse.json(
        { ok: false, message: "Le nom est obligatoire." },
        { status: 400, headers: NO_STORE },
      );
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("pieces")
      .update({
        nom,
        categorie: emptyToNull(formData.get("categorie")),
        stock_total: Number(formData.get("stock_total") || 0),
        notes: emptyToNull(formData.get("notes")),
      })
      .eq("id", id);

    if (error) {
      const code = classifySupabaseError(error.message);
      return NextResponse.json(
        { ok: false, message: messageForFailCode(code) },
        { status: 502, headers: NO_STORE },
      );
    }

    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      try {
        await storePiecePhoto(id, photo);
      } catch (err) {
        return NextResponse.json(
          {
            ok: false,
            message:
              err instanceof Error ? err.message : "Échec du téléversement photo.",
          },
          { status: 400, headers: NO_STORE },
        );
      }
    }

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    console.error("PATCH /api/pieces/[id] threw:", err);
    return NextResponse.json(
      { ok: false, message: messageForFailCode("unexpected") },
      { status: 500, headers: NO_STORE },
    );
  }
}

export async function DELETE(request: Request, context: Ctx) {
  const identity = await requireViewerOrResponse(request);
  if (identity instanceof Response) {
    return NextResponse.json(
      { ok: false, message: "Connexion Cursor requise." },
      { status: 401, headers: NO_STORE },
    );
  }
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { ok: false, message: messageForFailCode("not_configured") },
      { status: 503, headers: NO_STORE },
    );
  }

  const { id } = await context.params;
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("pieces").delete().eq("id", id);
    if (error) {
      const code = classifySupabaseError(error.message);
      return NextResponse.json(
        { ok: false, message: messageForFailCode(code) },
        { status: 502, headers: NO_STORE },
      );
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    console.error("DELETE /api/pieces/[id] threw:", err);
    return NextResponse.json(
      { ok: false, message: messageForFailCode("unexpected") },
      { status: 500, headers: NO_STORE },
    );
  }
}
