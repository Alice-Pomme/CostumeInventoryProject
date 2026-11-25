import { connection, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const TABLES = ["pieces", "costumes", "costume_pieces", "commandes"] as const;

/**
 * Lightweight connection probe. Avoids returning host names or raw DB errors.
 */
export async function GET() {
  await connection();

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { ok: false, configured: false },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const tables: Record<string, boolean> = {};

  for (const table of TABLES) {
    const { error } = await supabase.from(table).select("*").limit(1);
    tables[table] = !error;
  }

  const ok = Object.values(tables).every(Boolean);
  return NextResponse.json({ ok, configured: true, tables });
}
