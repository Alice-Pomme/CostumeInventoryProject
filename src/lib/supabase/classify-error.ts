import "server-only";

/** Safe, stable error codes for the UI — never echo raw DB text. */
export type SupabaseFailCode =
  | "not_configured"
  | "bad_key"
  | "schema_missing"
  | "permission"
  | "query_failed"
  | "unexpected";

export function classifySupabaseError(
  message: string | null | undefined,
): SupabaseFailCode {
  if (!message) return "query_failed";
  const lower = message.toLowerCase();
  if (lower.includes("invalid api key") || lower.includes("jwt")) {
    return "bad_key";
  }
  if (lower.includes("relation") && lower.includes("does not exist")) {
    return "schema_missing";
  }
  if (
    lower.includes("could not find the table") ||
    lower.includes("schema cache")
  ) {
    return "schema_missing";
  }
  if (
    lower.includes("row-level security") ||
    lower.includes("permission denied") ||
    lower.includes("42501")
  ) {
    return "permission";
  }
  return "query_failed";
}

export function messageForFailCode(code: SupabaseFailCode): string {
  switch (code) {
    case "not_configured":
      return "Secrets Supabase absents. Liez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.";
    case "bad_key":
      return "Clé Supabase invalide. Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.";
    case "schema_missing":
      return "Table « pieces » introuvable. Exécutez docs/sql/schema.sql dans le SQL Editor Supabase.";
    case "permission":
      return "Accès refusé par Supabase. Vérifiez le rôle service et le schéma.";
    case "query_failed":
      return "Impossible de charger les pièces depuis Supabase.";
    default:
      return "Erreur inattendue en chargeant les pièces.";
  }
}
