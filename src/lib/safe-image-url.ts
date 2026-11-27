/**
 * Allow https image URLs, or same-app private photo proxy paths.
 * Rejects javascript:, data:, http, and malformed values.
 */
export function safeImageSrc(
  url: string | null | undefined,
): string | null {
  if (url == null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Authenticated proxy for private Storage objects.
  if (/^\/api\/piece-photo\/[a-zA-Z0-9._/-]+$/.test(trimmed) && !trimmed.includes("..")) {
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password) return null;

  return parsed.toString();
}

/** Normalize a user-supplied photo URL before storing it. */
export function sanitizeStoredImageUrl(
  value: string | null | undefined,
): string | null {
  return safeImageSrc(value);
}
