import { NextResponse } from "next/server";
import { requireViewerOrResponse } from "@/lib/auth/require-viewer";
import {
  classifySupabaseError,
  messageForFailCode,
} from "@/lib/supabase/classify-error";
import { createServiceClient } from "@/lib/supabase/admin";
import { getSupabaseUrl, hasSupabaseEnv } from "@/lib/supabase/env";
import { storeInventoryPhoto } from "@/lib/supabase/store-photo";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

type CostumeDto = {
  id: string;
  nom: string;
  theme: string | null;
  photo_url: string | null;
  description: string | null;
  nombre: number;
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

function toCostume(row: Record<string, unknown>): CostumeDto | null {
  const id = row.id == null ? "" : String(row.id);
  const nom = row.nom == null ? "" : String(row.nom);
  if (!id || !nom.trim()) return null;
  const nombreRaw = row.nombre;
  return {
    id,
    nom,
    theme:
      typeof row.theme === "string"
        ? row.theme
        : row.theme == null
          ? null
          : String(row.theme),
    photo_url:
      typeof row.photo_url === "string"
        ? row.photo_url
        : row.photo_url == null
          ? null
          : String(row.photo_url),
    description:
      typeof row.description === "string"
        ? row.description
        : row.description == null
          ? null
          : String(row.description),
    nombre:
      typeof nombreRaw === "number"
        ? nombreRaw
        : nombreRaw == null
          ? 1
          : Number(nombreRaw) || 1,
  };
}

export async function GET(request: Request) {
  const identity = await requireViewerOrResponse(request);
  if (identity instanceof Response) {
    return NextResponse.json(
      {
        ok: false,
        costumes: [] as CostumeDto[],
        message: "Connexion Cursor requise. Rouvrez l’app depuis Cursor.",
      },
      { status: 401, headers: NO_STORE },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        ok: false,
        costumes: [] as CostumeDto[],
        message: messageForFailCode("not_configured"),
        host: hostLabel(),
      },
      { status: 503, headers: NO_STORE },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("costumes")
      .select("id, nom, theme, photo_url, description, nombre")
      .order("nom");

    if (error) {
      const code = classifySupabaseError(error.message);
      return NextResponse.json(
        {
          ok: false,
          costumes: [] as CostumeDto[],
          message: messageForFailCode(code),
          host: hostLabel(),
        },
        { status: 502, headers: NO_STORE },
      );
    }

    const costumes = (data ?? [])
      .map((row) => toCostume(row as Record<string, unknown>))
      .filter((c): c is CostumeDto => c != null);

    return NextResponse.json(
      { ok: true, costumes, message: null, host: hostLabel() },
      { headers: NO_STORE },
    );
  } catch (err) {
    console.error("GET /api/costumes threw:", err);
    return NextResponse.json(
      {
        ok: false,
        costumes: [] as CostumeDto[],
        message: messageForFailCode("unexpected"),
      },
      { status: 500, headers: NO_STORE },
    );
  }
}

/** Create costume (+ optional photo + optional piece_ids[]). */
export async function POST(request: Request) {
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
    const nombre = Math.max(1, Number(formData.get("nombre") || 1) || 1);
    const { data, error } = await supabase
      .from("costumes")
      .insert({
        nom,
        theme: emptyToNull(formData.get("theme")),
        description: emptyToNull(formData.get("description")),
        nombre,
        photo_url: null,
      })
      .select("id, nom, theme, photo_url, description, nombre")
      .single();

    if (error || !data) {
      const code = classifySupabaseError(error?.message);
      return NextResponse.json(
        { ok: false, message: messageForFailCode(code) },
        { status: 502, headers: NO_STORE },
      );
    }

    const costumeId = String(data.id);
    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      try {
        const photoPath = await storeInventoryPhoto(
          `costumes/${costumeId}`,
          photo,
        );
        await supabase
          .from("costumes")
          .update({ photo_url: photoPath })
          .eq("id", costumeId);
        (data as { photo_url: string | null }).photo_url = photoPath;
      } catch (err) {
        return NextResponse.json(
          {
            ok: true,
            costume: toCostume(data as Record<string, unknown>),
            warning:
              err instanceof Error
                ? err.message
                : "Costume créé, mais la photo a échoué.",
          },
          { status: 201, headers: NO_STORE },
        );
      }
    }

    const pieceIds = formData
      .getAll("piece_ids")
      .map((v) => String(v).trim())
      .filter(Boolean);

    if (pieceIds.length) {
      const rows = pieceIds.map((piece_id, index) => ({
        costume_id: costumeId,
        piece_id,
        quantite_par_costume: 1,
        ordre_habillage: index + 1,
      }));
      const { error: linkError } = await supabase
        .from("costume_pieces")
        .insert(rows);
      if (linkError) {
        return NextResponse.json(
          {
            ok: true,
            costume: toCostume(data as Record<string, unknown>),
            warning:
              "Costume créé, mais certaines pièces n’ont pas pu être liées.",
          },
          { status: 201, headers: NO_STORE },
        );
      }
    }

    return NextResponse.json(
      {
        ok: true,
        costume: toCostume(data as Record<string, unknown>),
        host: hostLabel(),
      },
      { status: 201, headers: NO_STORE },
    );
  } catch (err) {
    console.error("POST /api/costumes threw:", err);
    return NextResponse.json(
      { ok: false, message: messageForFailCode("unexpected") },
      { status: 500, headers: NO_STORE },
    );
  }
}
