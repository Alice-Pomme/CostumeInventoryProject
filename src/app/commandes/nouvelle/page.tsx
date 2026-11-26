import Link from "next/link";
import { CommandeForm } from "@/components/CommandeForm";
import { AppNav } from "@/components/AppNav";
import { PageShell } from "@/components/ui";
import { loadTableRows } from "@/lib/supabase/load";

export const dynamic = "force-dynamic";

export default async function NouvelleCommandePage() {
  const { rows: costumes } = await loadTableRows<{
    id: string;
    nom: string;
    theme: string | null;
  }>((supabase) =>
    supabase.from("costumes").select("id, nom, theme").order("nom"),
  );

  return (
    <>
      <AppNav />
      <PageShell
        title="Nouvelle commande"
        description="Saisissez le costume, la quantité et les dates — le besoin en pièces se calcule automatiquement."
        actions={
          <Link
            href="/commandes"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            ← Retour
          </Link>
        }
      >
        <CommandeForm costumes={costumes ?? []} />
      </PageShell>
    </>
  );
}
