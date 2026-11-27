import { NextResponse } from "next/server";
import { requireViewerOrResponse } from "@/lib/auth/require-viewer";
import { classifySupabaseError } from "@/lib/supabase/classify-error";
import { createServiceClient } from "@/lib/supabase/admin";
import { getSupabaseUrl, hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * Authenticated config + table probe for the owner (no raw DB errors).
 */
export async function GET(request: Request) {
  const identity = await requireViewerOrResponse(request);
  if (identity instanceof Response) {
    return new NextResponse(identity.body, {
      status: identity.status,
      headers: { ...NO_STORE, "Content-Type": "application/json" },
    });
  }

  const configured = hasSupabaseEnv();
  const url = getSupabaseUrl();
  let urlHost: string | null = null;
  try {
    urlHost = url ? new URL(url).host : null;
  } catch {
    urlHost = null;
  }

  if (!configured) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        urlHost,
        pieces: "not_configured",
      },
      { status: 503, headers: NO_STORE },
    );
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("pieces")
      .select("id")
      .limit(1);

    const pieces = error
      ? classifySupabaseError(error.message)
      : "ok";

    return NextResponse.json(
      {
        ok: pieces === "ok",
        configured: true,
        urlHost,
        pieces,
      },
      { headers: NO_STORE },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        urlHost,
        pieces: "unexpected",
      },
      { status: 500, headers: NO_STORE },
    );
  }
}
