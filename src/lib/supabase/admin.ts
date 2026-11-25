import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requireServiceRoleEnv } from "./env";

/**
 * Supabase client using the service role key (bypasses RLS).
 * Call only after requireViewer / requireIdentity — never from unauthenticated handlers.
 */
export function createServiceClient() {
  const { url, serviceRoleKey } = requireServiceRoleEnv();
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
