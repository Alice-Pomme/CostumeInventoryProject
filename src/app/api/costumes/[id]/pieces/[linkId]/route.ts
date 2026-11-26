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

type Ctx = { params: Promise<{ id: string; linkId: string }> };

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

  const { id: costumeId, linkId } = await context.params;
  try {
    const formData = await request.formData();
    const quantite = Number(formData.get("quantite_par_costume") || 1);
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("costume_pieces")
      .update({ quantite_par_costume: Math.max(1, quantite || 1) })
      .eq("id", linkId)
      .eq("costume_id", costumeId);

    if (error) {
      const code = classifySupabaseError(error.message);
      return NextResponse.json(
        { ok: false, message: messageForFailCode(code) },
        { status: 502, headers: NO_STORE },
      );
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    console.error("PATCH costume piece link threw:", err);
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

  const { id: costumeId, linkId } = await context.params;
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("costume_pieces")
      .delete()
      .eq("id", linkId)
      .eq("costume_id", costumeId);

    if (error) {
      const code = classifySupabaseError(error.message);
      return NextResponse.json(
        { ok: false, message: messageForFailCode(code) },
        { status: 502, headers: NO_STORE },
      );
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    console.error("DELETE costume piece link threw:", err);
    return NextResponse.json(
      { ok: false, message: messageForFailCode("unexpected") },
      { status: 500, headers: NO_STORE },
    );
  }
}
