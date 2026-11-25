import { AppNav } from "@/components/AppNav";

/**
 * Nav lives in the layout so it stays mounted when `error.tsx` replaces the page.
 * That avoids the confusing double “Erreur — Pièces” next to the section links.
 */
export default function PiecesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNav />
      {children}
    </>
  );
}
