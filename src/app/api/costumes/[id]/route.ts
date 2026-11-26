import { NextResponse } from "next/server";
import { requireViewerOrResponse } from "@/lib/auth/require-viewer";
import {
  classifySupabaseError,
  messageForFailCode,
} from "@/lib/supabase/classify-error";
import { createServiceClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { storeInventoryPhoto } from "@/lib/supabase/store-photo";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
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
      { ok: false, message: messageForFailCode("not_configured") },
      { status: 503, headers: NO_STORE },
    );
  }

  const { id } = await context.params;
  try {
    const supabase = createServiceClient();
    const [costumeRes, linksRes, piecesRes] = await Promise.all([
      supabase.from("costumes").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("costume_pieces")
        .select(
          "id, costume_id, piece_id, quantite_par_costume, ordre_habillage, created_at, pieces(id, nom, categorie, photo_url, stock_total)",
        )
        .eq("costume_id", id)
        .order("ordre_habillage", { ascending: true }),
      supabase.from("pieces").select("id, nom, categorie").order("nom"),
    ]);

    if (costumeRes.error) {
      const code = classifySupabaseError(costumeRes.error.message);
      return NextResponse.json(
        { ok: false, message: messageForFailCode(code) },
        { status: 502, headers: NO_STORE },
      );
    }
    if (!costumeRes.data) {
      return NextResponse.json(
        { ok: false, message: "Costume introuvable." },
        { status: 404, headers: NO_STORE },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        costume: costumeRes.data,
        links: linksRes.data ?? [],
        pieces: piecesRes.data ?? [],
      },
      { headers: NO_STORE },
    );
  } catch (err) {
    console.error("GET /api/costumes/[id] threw:", err);
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
    const updates: {
      nom: string;
      theme: string | null;
      description: string | null;
      photo_url?: string;
    } = {
      nom,
      theme: emptyToNull(formData.get("theme")),
      description: emptyToNull(formData.get("description")),
    };

    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      try {
        updates.photo_url = await storeInventoryPhoto(`costumes/${id}`, photo);
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

    const { error } = await supabase
      .from("costumes")
      .update(updates)
      .eq("id", id);

    if (error) {
      const code = classifySupabaseError(error.message);
      return NextResponse.json(
        { ok: false, message: messageForFailCode(code) },
        { status: 502, headers: NO_STORE },
      );
    }

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    console.error("PATCH /api/costumes/[id] threw:", err);
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
    const { error } = await supabase.from("costumes").delete().eq("id", id);
    if (error) {
      const code = classifySupabaseError(error.message);
      return NextResponse.json(
        { ok: false, message: messageForFailCode(code) },
        { status: 502, headers: NO_STORE },
      );
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    console.error("DELETE /api/costumes/[id] threw:", err);
    return NextResponse.json(
      { ok: false, message: messageForFailCode("unexpected") },
      { status: 500, headers: NO_STORE },
    );
  }
}
