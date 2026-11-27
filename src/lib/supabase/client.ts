/**
 * Browser Supabase client is intentionally unavailable.
 * All inventory access goes through server actions / RSC with the service role.
 */
export function createClient(): never {
  throw new Error(
    "Client-side Supabase is disabled. Use server actions for inventory data.",
  );
}
