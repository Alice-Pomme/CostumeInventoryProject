import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseUrl, hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const EXPECTED_HOST = "aajszyvzngnfmkqrffek.supabase.co";
const TABLES = ["pieces", "costumes", "costume_pieces", "commandes"] as const;

/**
 * Connection probe that never returns secret values.
 * Reports only URL host match + whether each core table is reachable.
 */
export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message:
        "SUPABASE_URL and SUPABASE_ANON_KEY (or NEXT_PUBLIC_*) are not set in this runtime.",
    });
  }

  const url = getSupabaseUrl();
  let host = "";
  try {
    host = new URL(url).host;
  } catch {
    return NextResponse.json({
      ok: false,
      configured: true,
      urlHostOk: false,
      message: "SUPABASE_URL is not a valid URL.",
    });
  }

  const urlHostOk = host === EXPECTED_HOST;
  const supabase = await createClient();

  const tables: Record<string, { ok: boolean; error?: string }> = {};
  for (const table of TABLES) {
    const { error } = await supabase.from(table).select("*").limit(1);
    tables[table] = error
      ? { ok: false, error: error.message }
      : { ok: true };
  }

  const allOk = Object.values(tables).every((t) => t.ok);

  return NextResponse.json({
    ok: urlHostOk && allOk,
    configured: true,
    urlHostOk,
    expectedHost: EXPECTED_HOST,
    actualHost: host,
    tables,
    hint: urlHostOk
      ? undefined
      : "URL host should be aajszyvzngnfmkqrffek.supabase.co (Project Settings → API Keys / Connect).",
  });
}
