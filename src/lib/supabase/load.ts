import "server-only";

import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { IdentityError, requireViewer } from "@/lib/auth/require-viewer";
import { createServiceClient } from "./admin";
import { hasSupabaseEnv } from "./env";

/**
 * Await request connection, then open a Supabase client when env is present
 * and a Cursor viewer is verified. Never throws for missing env / auth —
 * callers get `null` and can render empty UI.
 */
export async function getSupabaseOrNull(): Promise<SupabaseClient<Database> | null> {
  await connection();
  if (!hasSupabaseEnv()) return null;
  try {
    await requireViewer();
    return createServiceClient();
  } catch (err) {
    if (err instanceof IdentityError) {
      console.error("Viewer required before Supabase access:", err.reason);
      return null;
    }
    console.error("Supabase client init failed:", err);
    return null;
  }
}

export async function loadTableRows<T>(
  run: (supabase: SupabaseClient<Database>) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<{ rows: T[]; errorMessage: string | null }> {
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return { rows: [], errorMessage: null };
  }
  try {
    const { data, error } = await run(supabase);
    return {
      rows: data ?? [],
      errorMessage: error ? "Impossible de charger les données." : null,
    };
  } catch (err) {
    console.error("Supabase query failed:", err);
    return { rows: [], errorMessage: "Impossible de charger les données." };
  }
}
