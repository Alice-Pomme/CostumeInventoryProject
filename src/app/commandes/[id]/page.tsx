export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteCommande } from "@/app/actions/commandes";
import { CommandeForm } from "@/components/CommandeForm";
import { AppNav } from "@/components/AppNav";
import { Button, PageShell } from "@/components/ui";

type Props = { params: Promise<{ id: string }> };

export default async function CommandeDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: commande, error }, { data: costumes }] = await Promise.all([
    supabase.from("commandes").select("*").eq("id", id).maybeSingle(),
    supabase.from("costumes").select("id, nom, theme").order("nom"),
  ]);

  if (error) {
    return (
      <>
        <AppNav />
        <PageShell title="Commande">
          <p className="text-sm text-red-600">{error.message}</p>
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
