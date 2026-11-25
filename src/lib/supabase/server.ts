import "server-only";

import { connection } from "next/server";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireViewer } from "@/lib/auth/require-viewer";
import { createServiceClient } from "./admin";

/**
 * Server Components / actions.
 * Requires a signed-in Cursor viewer, then uses the service role so the
 * private app can read/write while RLS denies the anon key.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  await connection();
  await requireViewer();
  return createServiceClient();
}
