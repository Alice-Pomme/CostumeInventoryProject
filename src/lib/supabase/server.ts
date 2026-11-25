// Server-only module — do not import from Client Components.

import { connection } from "next/server";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "./admin";

/**
 * Server Components / actions / route handlers.
 * Uses the service role so the private Cursor app can read/write while
 * RLS denies the anon key (see docs/sql/schema.sql).
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  await connection();
  return createServiceClient();
}
