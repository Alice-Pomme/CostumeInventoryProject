import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { PageShell } from "@/components/ui";
import { getSupabaseOrNull } from "@/lib/supabase/load";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PieceDetailPage({ params }: Props) {
  const { id } = await params;

  try {
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

    const plain = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
    const nom = String(plain.nom ?? "Pièce");
    const categorie =
      plain.categorie == null ? "—" : String(plain.categorie);
    const stock =
      typeof plain.stock_total === "number"
        ? plain.stock_total
        : Number(plain.stock_total) || 0;
    const notes = plain.notes == null ? "—" : String(plain.notes);
    const photo = plain.photo_url == null ? "—" : String(plain.photo_url);

    return (
      <>
        <AppNav />
        <PageShell
          title={nom}
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
              <dd>{categorie}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Stock total</dt>
              <dd>{stock}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-zinc-500">Notes</dt>
              <dd>{notes}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-zinc-500">Photo URL</dt>
              <dd className="break-all text-zinc-600">{photo}</dd>
            </div>
          </dl>
        </PageShell>
      </>
    );
  } catch (err) {
    const digest =
      err && typeof err === "object" && "digest" in err
        ? String((err as { digest?: unknown }).digest)
        : "";
    if (
      digest === "DYNAMIC_SERVER_USAGE" ||
      digest.startsWith("NEXT_")
    ) {
      throw err;
    }
    console.error("PieceDetailPage failed:", err);
    return (
      <>
        <AppNav />
        <PageShell title="Pièce">
          <p className="text-sm text-red-600">
            Impossible d’afficher cette fiche.
          </p>
          <Link href="/pieces" className="mt-4 inline-block text-sm underline">
            ← Retour aux pièces
          </Link>
        </PageShell>
      </>
    );
  }
}
