import { NextResponse } from "next/server";
import { requireViewerOrResponse } from "@/lib/auth/require-viewer";
import {
  classifySupabaseError,
  messageForFailCode,
} from "@/lib/supabase/classify-error";
import { createServiceClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

type Ctx = { params: Promise<{ id: string }> };

/** Link a piece to the costume (or reorder all links). */
export async function POST(request: Request, context: Ctx) {
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

  const { id: costumeId } = await context.params;

  try {
    const contentType = request.headers.get("content-type") || "";
    const supabase = createServiceClient();

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        action?: string;
        orderedLinkIds?: string[];
      };
      if (body.action === "reorder" && Array.isArray(body.orderedLinkIds)) {
        const results = await Promise.all(
          body.orderedLinkIds.map((linkId, index) =>
            supabase
              .from("costume_pieces")
              .update({ ordre_habillage: index + 1 })
              .eq("id", linkId)
              .eq("costume_id", costumeId),
          ),
        );
        const failed = results.find((r) => r.error);
        if (failed?.error) {
          const code = classifySupabaseError(failed.error.message);
          return NextResponse.json(
            { ok: false, message: messageForFailCode(code) },
            { status: 502, headers: NO_STORE },
          );
        }
        return NextResponse.json({ ok: true }, { headers: NO_STORE });
      }
      return NextResponse.json(
        { ok: false, message: "Requête invalide." },
        { status: 400, headers: NO_STORE },
      );
    }

    const formData = await request.formData();
    const pieceId = String(formData.get("piece_id") ?? "").trim();
    if (!pieceId) {
      return NextResponse.json(
        { ok: false, message: "Choisissez une pièce." },
        { status: 400, headers: NO_STORE },
      );
    }
    const quantite = Number(formData.get("quantite_par_costume") || 1);

    const { data: existing } = await supabase
      .from("costume_pieces")
      .select("ordre_habillage")
      .eq("costume_id", costumeId)
      .order("ordre_habillage", { ascending: false })
      .limit(1);

    const nextOrder =
      existing && existing.length > 0
        ? Number(existing[0].ordre_habillage ?? 0) + 1
        : 1;

    const { error } = await supabase.from("costume_pieces").insert({
      costume_id: costumeId,
      piece_id: pieceId,
      quantite_par_costume: Math.max(1, quantite || 1),
      ordre_habillage: nextOrder,
    });

    if (error) {
      const code = classifySupabaseError(error.message);
      return NextResponse.json(
        { ok: false, message: messageForFailCode(code) },
        { status: 502, headers: NO_STORE },
      );
    }

    return NextResponse.json({ ok: true }, { status: 201, headers: NO_STORE });
  } catch (err) {
    console.error("POST /api/costumes/[id]/pieces threw:", err);
    return NextResponse.json(
      { ok: false, message: messageForFailCode("unexpected") },
      { status: 500, headers: NO_STORE },
    );
  }
}
