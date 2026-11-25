import { NextResponse } from "next/server";
import { requireViewerOrResponse } from "@/lib/auth/require-viewer";
import { createServiceClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

type PieceDto = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number;
  notes: string | null;
};

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

/** JSON list for the client pieces UI — requires a signed-in Cursor viewer. */
export async function GET(request: Request) {
  const identity = await requireViewerOrResponse(request);
  if (identity instanceof Response) {
    return new NextResponse(identity.body, {
      status: identity.status,
      headers: { ...NO_STORE, "Content-Type": "application/json" },
    });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { ok: false, pieces: [] as PieceDto[], error: "not_configured" },
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
      console.error("GET /api/pieces query failed");
      return NextResponse.json(
        { ok: false, pieces: [] as PieceDto[], error: "query_failed" },
        { status: 502, headers: NO_STORE },
      );
    }

    const pieces = (data ?? [])
      .map((row) => toPiece(row as Record<string, unknown>))
      .filter((p): p is PieceDto => p != null);

    return NextResponse.json(
      { ok: true, pieces, error: null },
      { headers: NO_STORE },
    );
  } catch (err) {
    console.error("GET /api/pieces threw:", err);
    return NextResponse.json(
      { ok: false, pieces: [] as PieceDto[], error: "unexpected" },
      { status: 500, headers: NO_STORE },
    );
  }
}
