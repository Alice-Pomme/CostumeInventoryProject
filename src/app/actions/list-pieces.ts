"use server";

import {
  IdentityError,
  requireViewer,
} from "@/lib/auth/require-viewer";
import {
  classifySupabaseError,
  messageForFailCode,
  type SupabaseFailCode,
} from "@/lib/supabase/classify-error";
import { createServiceClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type PieceListItem = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number;
  notes: string | null;
};

export type ListPiecesResult = {
  ok: boolean;
  pieces: PieceListItem[];
  error: SupabaseFailCode | "unauthorized" | null;
  message: string | null;
};

function toPiece(row: Record<string, unknown>): PieceListItem | null {
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

/**
 * List pieces via a server action (same identity path as other mutations).
 * Preferred over GET /api/pieces for the UI.
 */
export async function listPieces(): Promise<ListPiecesResult> {
  try {
    await requireViewer();
  } catch (err) {
    if (err instanceof IdentityError) {
      return {
        ok: false,
        pieces: [],
        error: "unauthorized",
        message: "Connexion Cursor requise pour charger les pièces.",
      };
    }
    throw err;
  }

  if (!hasSupabaseEnv()) {
    return {
      ok: false,
      pieces: [],
      error: "not_configured",
      message: messageForFailCode("not_configured"),
    };
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("pieces")
      .select("id, nom, categorie, stock_total, notes")
      .order("nom");

    if (error) {
      const code = classifySupabaseError(error.message);
      console.error("listPieces failed:", code);
      return {
        ok: false,
        pieces: [],
        error: code,
        message: messageForFailCode(code),
      };
    }

    const pieces = (data ?? [])
      .map((row) => toPiece(row as Record<string, unknown>))
      .filter((p): p is PieceListItem => p != null);

    return { ok: true, pieces, error: null, message: null };
  } catch (err) {
    console.error("listPieces threw:", err);
    return {
      ok: false,
      pieces: [],
      error: "unexpected",
      message: messageForFailCode("unexpected"),
    };
  }
}
