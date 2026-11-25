export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { PieceEditForm } from "@/components/PieceEditForm";
import { PageShell } from "@/components/ui";
import { getSupabaseOrNull } from "@/lib/supabase/load";

type Props = { params: Promise<{ id: string }> };

export default async function PieceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseOrNull();
  if (!supabase) notFound();

  let piece = null;
  let categories: string[] = [];
  let errorMessage: string | null = null;
  try {
    const [{ data, error }, { data: allCats }] = await Promise.all([
      supabase.from("pieces").select("*").eq("id", id).maybeSingle(),
      supabase.from("pieces").select("categorie").not("categorie", "is", null),
    ]);
    piece = data;
    if (error) errorMessage = error.message;
    const seen = new Set<string>();
    for (const row of allCats ?? []) {
      const cat = row.categorie?.trim();
      if (!cat) continue;
      const key = cat.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      categories.push(cat);
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Erreur inattendue.";
  }

  if (errorMessage) {
    return (
      <>
        <AppNav />
        <PageShell title="Pièce">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </PageShell>
      </>
    );
  }
  if (!piece) notFound();

  return (
    <>
      <AppNav />
      <PageShell
        title={piece.nom}
        description="Modifier la pièce et sa photo."
        actions={
          <Link
            href="/pieces"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            ← Retour aux pièces
          </Link>
        }
      >
        <PieceEditForm piece={piece} categories={categories} />
      </PageShell>
    </>
  );
}
