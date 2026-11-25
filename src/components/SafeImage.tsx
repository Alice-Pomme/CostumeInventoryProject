import { safeImageSrc } from "@/lib/safe-image-url";

type Props = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
};

/** Renders an <img> only when src is a safe https URL. */
export function SafeImage({
  src,
  alt = "",
  className,
  fallback = null,
}: Props) {
  const safe = safeImageSrc(src);
  if (!safe) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={safe} alt={alt} className={className} />;
}
