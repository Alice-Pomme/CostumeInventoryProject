import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { PageShell } from "@/components/ui";
import { getSupabaseOrNull } from "@/lib/supabase/load";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Server-only detail (no PieceEditForm client island) so the /pieces
 * segment matches /costumes: no client create/edit bundle on first paint.
 */
export default async function PieceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseOrNull();

  if (!supabase) {
    return (
      <>
        <AppNav />
        <PageShell title="Pièce">
          <p className="text-sm text-red-600">
            Connexion Supabase indisponible.
          </p>
          <Link href="/pieces" className="mt-4 inline-block text-sm underline">
            ← Retour aux pièces
          </Link>
        </PageShell>
      </>
    );
  }

  const { data, error } = await supabase
    .from("pieces")
    .select("id, nom, categorie, stock_total, photo_url, notes")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <>
        <AppNav />
        <PageShell title="Pièce">
          <p className="text-sm text-red-600">
            Impossible de charger la pièce.
          </p>
          <Link href="/pieces" className="mt-4 inline-block text-sm underline">
            ← Retour aux pièces
          </Link>
        </PageShell>
      </>
    );
  }

  if (!data) notFound();

  return (
    <>
      <AppNav />
      <PageShell
        title={data.nom}
        description="Fiche pièce."
        actions={
          <Link
            href="/pieces"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            ← Retour aux pièces
          </Link>
        }
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Catégorie</dt>
            <dd>{data.categorie || "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Stock total</dt>
            <dd>{data.stock_total ?? 0}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-zinc-500">Notes</dt>
            <dd>{data.notes || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-zinc-500">Photo URL</dt>
            <dd className="break-all text-zinc-600">
              {data.photo_url || "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-sm text-zinc-500">
          L’édition complète (photo dropzone) revient dès que la liste est
          stable.
        </p>
      </PageShell>
    </>
  );
}
