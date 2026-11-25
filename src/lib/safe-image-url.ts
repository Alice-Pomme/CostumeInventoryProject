/**
 * Allow only https image URLs for rendering in <img src>.
 * Rejects javascript:, data:, http, and malformed values.
 */
export function safeImageSrc(
  url: string | null | undefined,
): string | null {
  if (url == null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

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
