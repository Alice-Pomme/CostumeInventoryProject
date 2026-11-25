import { connection, NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

/**
 * Config probe only — does not query tables or expose schema reachability.
 */
export async function GET() {
  await connection();

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { ok: false, configured: false },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, configured: true });
}
