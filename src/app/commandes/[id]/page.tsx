import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCommande } from "@/app/actions/commandes";
import { CommandeForm } from "@/components/CommandeForm";
import { AppNav } from "@/components/AppNav";
import { Button, PageShell } from "@/components/ui";
import { getSupabaseOrNull, loadTableRows } from "@/lib/supabase/load";
import { friendlyDbError } from "@/lib/db-errors";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function CommandeDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseOrNull();
  if (!supabase) notFound();

  let commande = null;
  let errorMessage: string | null = null;
  try {
    const { data, error } = await supabase
      .from("commandes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    commande = data;
    if (error) errorMessage = friendlyDbError(error.message);
  } catch (err) {
    errorMessage = friendlyDbError(err instanceof Error ? err.message : "Erreur inattendue.");
  }

  const { rows: costumes } = await loadTableRows<{
    id: string;
    nom: string;
    theme: string | null;
  }>((client) =>
    client.from("costumes").select("id, nom, theme").order("nom"),
  );

  if (errorMessage) {
    return (
      <>
        <AppNav />
        <PageShell title="Commande">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </PageShell>
      </>
    );
  }
  if (!commande) notFound();

  return (
    <>
      <AppNav />
      <PageShell
        title={commande.client_nom || "Commande"}
        description="Modifier la location et vérifier le stock consolidé."
        actions={
          <Link
            href="/commandes"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            ← Retour aux commandes
          </Link>
        }
      >
        <CommandeForm costumes={costumes ?? []} commande={commande} />

        <form action={deleteCommande.bind(null, commande.id)} className="mt-8">
          <Button type="submit" variant="danger">
            Supprimer la commande
          </Button>
        </form>
      </PageShell>
    </>
  );
}
