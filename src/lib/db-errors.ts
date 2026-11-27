/** Map raw PostgREST/Postgres messages to safe French UI copy. Never rethrow raw. */
export function friendlyDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("relation") && lower.includes("does not exist")) {
    return "Table manquante. Réexécutez le schéma SQL dans Supabase.";
  }
  if (
    lower.includes("row-level security") ||
    lower.includes("rls") ||
    lower.includes("new row violates")
  ) {
    return "Accès refusé. Vérifiez les clés et le schéma Supabase.";
  }
  if (lower.includes("invalid api key") || lower.includes("jwt")) {
    return "Clé Supabase invalide. Vérifiez la configuration.";
  }
  if (lower.includes("permission denied") || lower.includes("42501")) {
    return "Permission refusée sur la base.";
  }
  if (lower.includes("bucket") || lower.includes("not found")) {
    return "Stockage photo introuvable ou inaccessible.";
  }
  return "Erreur base de données. Réessayez ou vérifiez Supabase.";
}
