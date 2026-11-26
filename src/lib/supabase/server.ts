import "server-only";

import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireViewer } from "@/lib/auth/require-viewer";
import { createServiceClient } from "./admin";

/**
 * Server Components / actions.
 * Requires a signed-in Cursor viewer, then uses the service role.
 * Avoids next/server connection() — headers via requireViewer already mark the route dynamic.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  await requireViewer();
  return createServiceClient();
}
