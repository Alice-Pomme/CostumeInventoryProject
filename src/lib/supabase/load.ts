import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createServiceClient } from "./admin";
import { hasSupabaseEnv } from "./env";

/**
 * Await request connection, then open a Supabase client when env is present.
 * Never throws for missing env — callers get `null` and can render empty UI.
 */
export async function getSupabaseOrNull(): Promise<SupabaseClient<Database> | null> {
  await connection();
  if (!hasSupabaseEnv()) return null;
  try {
    return createServiceClient();
  } catch (err) {
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
      errorMessage: error?.message ?? null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    console.error("Supabase query failed:", err);
    return { rows: [], errorMessage: message };
  }
}
