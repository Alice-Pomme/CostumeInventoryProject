import "server-only";

/**
 * Server-only Supabase env resolution.
 * Do not use NEXT_PUBLIC_* for keys — those would ship to the browser.
 */

export function getSupabaseUrl(): string {
  return (process.env.SUPABASE_URL ?? "").trim();
}

export function getSupabaseAnonKey(): string {
  return (process.env.SUPABASE_ANON_KEY ?? "").trim();
}

export function getSupabaseServiceRoleKey(): string {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
}

/** App data access requires URL + service role (server-side only). */
export function hasSupabaseEnv(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env. Set SUPABASE_URL and SUPABASE_ANON_KEY (see .env.local.example).",
    );
  }
  return { url, anonKey };
}

export function requireServiceRoleEnv(): { url: string; serviceRoleKey: string } {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only secrets).",
    );
  }
  return { url, serviceRoleKey };
}
