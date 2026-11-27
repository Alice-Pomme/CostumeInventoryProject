import { NextResponse } from "next/server";
import { requireViewerOrResponse } from "@/lib/auth/require-viewer";
import { createServiceClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PHOTOS_PIECES_BUCKET } from "@/types/database";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** Only allow pieceId/filename-style object keys — no `..` or absolute paths. */
function isSafeObjectPath(parts: string[]): boolean {
  if (parts.length < 2 || parts.length > 4) return false;
  return parts.every(
    (p) => p.length > 0 && p.length < 200 && !p.includes("..") && /^[a-zA-Z0-9._-]+$/.test(p),
  );
}

/**
 * Streams a private Storage object to an authenticated Cursor viewer.
 * photo_url values look like `/api/piece-photo/{pieceId}/{file}`.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const identity = await requireViewerOrResponse(request);
  if (identity instanceof Response) {
    return new NextResponse(null, { status: identity.status, headers: NO_STORE });
  }

  if (!hasSupabaseEnv()) {
    return new NextResponse(null, { status: 503, headers: NO_STORE });
  }

  const { path: parts } = await context.params;
  if (!isSafeObjectPath(parts)) {
    return new NextResponse(null, { status: 400, headers: NO_STORE });
  }

  const objectPath = parts.join("/");

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.storage
      .from(PHOTOS_PIECES_BUCKET)
      .download(objectPath);

    if (error || !data) {
      return new NextResponse(null, { status: 404, headers: NO_STORE });
    }

    const contentType = data.type || "application/octet-stream";
    const bytes = await data.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        ...NO_STORE,
        "Content-Type": contentType,
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (err) {
    console.error("GET /api/piece-photo failed:", err);
    return new NextResponse(null, { status: 500, headers: NO_STORE });
  }
}
