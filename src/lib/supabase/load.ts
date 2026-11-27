import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { IdentityError, requireViewer } from "@/lib/auth/require-viewer";
import {
  classifySupabaseError,
  messageForFailCode,
} from "@/lib/supabase/classify-error";
import { createServiceClient } from "./admin";
import { getSupabaseUrl, hasSupabaseEnv } from "./env";

function isNextControlError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const digest =
    "digest" in err ? String((err as { digest?: unknown }).digest) : "";
  return (
    digest === "DYNAMIC_SERVER_USAGE" ||
    digest.startsWith("NEXT_") ||
    digest.startsWith("PRIMETIME_") ||
    digest.startsWith("BAILOUT_")
  );
}

export function supabaseHostLabel(): string | null {
  const url = getSupabaseUrl();
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Open a service-role client after verifying the Cursor viewer.
 * Does NOT call connection() — that bailout was being swallowed and broke /pieces.
 * requireViewer() reads headers(), which already opts the route into dynamic rendering.
 */
export async function getSupabaseOrNull(): Promise<SupabaseClient<Database> | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    await requireViewer();
    return createServiceClient();
  } catch (err) {
    if (isNextControlError(err)) throw err;
    if (err instanceof IdentityError) {
      console.error("Viewer required before Supabase access:", err.reason);
      return null;
    }
    console.error("Supabase client init failed:", err);
    return null;
  }
}

export async function loadTableRows<T>(
  run: (supabase: SupabaseClient<Database>) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<{
  rows: T[];
  errorMessage: string | null;
  host: string | null;
  configured: boolean;
}> {
  const host = supabaseHostLabel();
  const configured = hasSupabaseEnv();

  if (!configured) {
    return {
      rows: [],
      errorMessage: messageForFailCode("not_configured"),
      host,
      configured: false,
    };
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return {
      rows: [],
      errorMessage:
        "Impossible de vérifier la session Cursor pour lire Supabase. Rouvrez l’app depuis Cursor, ou rechargez la page.",
      host,
      configured: true,
    };
  }

  try {
    const { data, error } = await run(supabase);
    if (error) {
      const code = classifySupabaseError(error.message);
      console.error("loadTableRows query failed:", code);
      return {
        rows: [],
        errorMessage: messageForFailCode(code),
        host,
        configured: true,
      };
    }
    return {
      rows: data ?? [],
      errorMessage: null,
      host,
      configured: true,
    };
  } catch (err) {
    if (isNextControlError(err)) throw err;
    console.error("Supabase query failed:", err);
    return {
      rows: [],
      errorMessage: messageForFailCode("unexpected"),
      host,
      configured: true,
    };
  }
}
