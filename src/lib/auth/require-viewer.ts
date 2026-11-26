import "server-only";

import { headers } from "next/headers";
import {
  IdentityError,
  getIdentity,
  requireIdentity,
  verifyIdentity,
  type IdentityFailureReason,
  type VerifiedIdentity,
} from "../../../cursor/identity";

/**
 * Copy Next.js headers into a web Headers object.
 * Passing ReadonlyHeaders directly can miss identity headers depending on host.
 */
async function identityHeaders(): Promise<Headers> {
  const incoming = await headers();
  const out = new Headers();
  incoming.forEach((value, key) => {
    out.append(key, value);
  });
  return out;
}

/**
 * Gate for Server Components and Server Actions.
 * Prefers the raw identity token when Next exposes it, then falls back to the helper.
 */
export async function requireViewer(): Promise<VerifiedIdentity> {
  const h = await identityHeaders();
  const token =
    h.get("x-cursor-identity-v2")?.trim() ||
    h.get("x-cursor-identity")?.trim() ||
    "";

  if (token) {
    const identity = await verifyIdentity(token);
    if (identity.verified) return identity;
    throw new IdentityError(401, identity.reason);
  }

  return requireIdentity(h, { onFailure: "throw" });
}

/** Soft check — returns reason when unverified (never throws). */
export async function peekViewer(): Promise<
  | { verified: true; identity: VerifiedIdentity }
  | { verified: false; reason: IdentityFailureReason }
> {
  const h = await identityHeaders();
  const identity = await getIdentity(h);
  if (identity.verified) return { verified: true, identity };
  return { verified: false, reason: identity.reason };
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
