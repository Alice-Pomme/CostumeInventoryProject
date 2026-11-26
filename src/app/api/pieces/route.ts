import { NextResponse } from "next/server";
import { requireViewerOrResponse } from "@/lib/auth/require-viewer";
import {
  classifySupabaseError,
  messageForFailCode,
} from "@/lib/supabase/classify-error";
import { createServiceClient } from "@/lib/supabase/admin";
import { getSupabaseUrl, hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

type PieceDto = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number;
  notes: string | null;
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
  };
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

/** JSON list — identity comes from the web Request (gate-injected). */
export async function GET(request: Request) {
  const identity = await requireViewerOrResponse(request);
  if (identity instanceof Response) {
    return NextResponse.json(
      {
        ok: false,
        pieces: [] as PieceDto[],
        error: "unauthorized",
        message: "Connexion Cursor requise. Rouvrez l’app depuis Cursor.",
        host: hostLabel(),
      },
      { status: 401, headers: NO_STORE },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        ok: false,
        pieces: [] as PieceDto[],
        error: "not_configured",
        message: messageForFailCode("not_configured"),
        host: hostLabel(),
      },
      { status: 503, headers: NO_STORE },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("pieces")
      .select("id, nom, categorie, stock_total, notes")
      .order("nom");

    if (error) {
      const code = classifySupabaseError(error.message);
      console.error("GET /api/pieces:", code);
      return NextResponse.json(
        {
          ok: false,
          pieces: [] as PieceDto[],
          error: code,
          message: messageForFailCode(code),
          host: hostLabel(),
        },
        { status: 502, headers: NO_STORE },
      );
    }

    const pieces = (data ?? [])
      .map((row) => toPiece(row as Record<string, unknown>))
      .filter((p): p is PieceDto => p != null);

    const categories = [
      ...new Set(
        pieces
          .map((p) => (p.categorie ?? "").trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

    return NextResponse.json(
      {
        ok: true,
        pieces,
        categories,
        error: null,
        message: null,
        host: hostLabel(),
      },
      { headers: NO_STORE },
    );
  } catch (err) {
    console.error("GET /api/pieces threw:", err);
    return NextResponse.json(
      {
        ok: false,
        pieces: [] as PieceDto[],
        error: "unexpected",
        message: messageForFailCode("unexpected"),
        host: hostLabel(),
      },
      { status: 500, headers: NO_STORE },
    );
  }
}

/** Create a piece — same Request identity path as GET. */
export async function POST(request: Request) {
  const identity = await requireViewerOrResponse(request);
  if (identity instanceof Response) {
    return NextResponse.json(
      { ok: false, error: "unauthorized", message: "Connexion Cursor requise." },
      { status: 401, headers: NO_STORE },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        ok: false,
        error: "not_configured",
        message: messageForFailCode("not_configured"),
      },
      { status: 503, headers: NO_STORE },
    );
  }

  try {
    const formData = await request.formData();
    const nom = String(formData.get("nom") ?? "").trim();
    if (!nom) {
      return NextResponse.json(
        { ok: false, error: "validation", message: "Le nom est obligatoire." },
        { status: 400, headers: NO_STORE },
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("pieces")
      .insert({
        nom,
        categorie: emptyToNull(formData.get("categorie")),
        stock_total: Number(formData.get("stock_total") || 0),
        notes: emptyToNull(formData.get("notes")),
      })
      .select("id, nom, categorie, stock_total, notes")
      .single();

    if (error || !data) {
      const code = classifySupabaseError(error?.message);
      return NextResponse.json(
        {
          ok: false,
          error: code,
          message: messageForFailCode(code),
          host: hostLabel(),
        },
        { status: 502, headers: NO_STORE },
      );
    }

    const piece = toPiece(data as Record<string, unknown>);
    return NextResponse.json(
      { ok: true, piece, host: hostLabel() },
      { status: 201, headers: NO_STORE },
    );
  } catch (err) {
    console.error("POST /api/pieces threw:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "unexpected",
        message: messageForFailCode("unexpected"),
      },
      { status: 500, headers: NO_STORE },
    );
  }
}
