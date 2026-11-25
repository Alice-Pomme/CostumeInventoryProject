import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requireServiceRoleEnv } from "./env";

/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS — never import this module from client components.
 */
export function createServiceClient() {
  const { url, serviceRoleKey } = requireServiceRoleEnv();
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
