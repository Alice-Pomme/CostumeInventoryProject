import "server-only";

import { headers } from "next/headers";
import {
  IdentityError,
  requireIdentity,
  type VerifiedIdentity,
} from "../../../cursor/identity";

/**
 * Gate for Server Components and Server Actions: require a signed-in Cursor
 * viewer (or simulated local viewer) before using the Supabase service role.
 */
export async function requireViewer(): Promise<VerifiedIdentity> {
  return requireIdentity(await headers(), { onFailure: "throw" });
}

/**
 * Gate for route handlers that receive the web Request.
 * Returns the verified identity, or a 401 Response to return as-is.
 */
export async function requireViewerOrResponse(
  request: Request,
): Promise<VerifiedIdentity | Response> {
  return requireIdentity(request);
}

export function unauthorizedMessage(err: unknown): string {
  if (err instanceof IdentityError) {
    return "Connexion Cursor requise pour accéder à l’inventaire.";
  }
  return err instanceof Error ? err.message : "Non autorisé.";
}

export { IdentityError };
