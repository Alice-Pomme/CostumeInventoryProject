export const instant = false;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CommandeForm } from "@/components/CommandeForm";
import { AppNav } from "@/components/AppNav";
import { PageShell } from "@/components/ui";

export default async function NouvelleCommandePage() {
  const supabase = await createClient();
  const { data: costumes } = await supabase
    .from("costumes")
    .select("id, nom, theme")
    .order("nom");

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
