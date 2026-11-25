import { connection, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

/** Owner diagnostics for /pieces load — no secrets in the body. */
export async function GET() {
  await connection();
  const configured = hasSupabaseEnv();
  if (!configured) {
    return NextResponse.json({ ok: false, configured: false, step: "env" });
  }
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("pieces")
      .select("id, nom")
      .order("nom")
      .limit(5);
    if (error) {
      return NextResponse.json({
        ok: false,
        configured: true,
        step: "query",
        error: error.message.slice(0, 200),
      });
    }
    return NextResponse.json({
      ok: true,
      configured: true,
      step: "query",
      count: data?.length ?? 0,
      sampleNames: (data ?? []).map((r) => r.nom),
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      configured: true,
      step: "throw",
      error: err instanceof Error ? err.message.slice(0, 200) : "unknown",
    });
  }
}
