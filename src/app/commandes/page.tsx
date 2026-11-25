export const instant = false;

import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { PageShell } from "@/components/ui";
import {
  COMMANDE_STATUT_LABELS,
  type CommandeStatut,
  type CommandeWithCostume,
} from "@/types/database";

export default async function CommandesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commandes")
    .select(
      "id, client_nom, costume_id, quantite_costumes, date_debut, date_fin, statut, costumes(id, nom, theme)",
    )
    .order("date_debut", { ascending: false });

  const commandes = (data ?? []) as unknown as CommandeWithCostume[];

  return (
    <>
      <AppNav />
      <PageShell
        title="Commandes"
        description="Locations de costumes avec contrôle de stock sur les dates."
        actions={
          <Link
            href="/commandes/nouvelle"
            className="inline-flex items-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nouvelle commande
          </Link>
        }
      >
        {error ? (
          <p className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            Impossible de charger les commandes : {error.message}
          </p>
        ) : null}

        {!commandes.length ? (
          <p className="text-sm text-zinc-500">
            Aucune commande.{" "}
            <Link href="/commandes/nouvelle" className="underline">
              Créer la première
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {commandes.map((cmd) => {
              const statut = (cmd.statut ?? "brouillon") as CommandeStatut;
              return (
                <li key={cmd.id}>
                  <Link
                    href={`/commandes/${cmd.id}`}
                    className="block py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {cmd.client_nom || "Client sans nom"}
                      </p>
                      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        {COMMANDE_STATUT_LABELS[statut] ?? cmd.statut}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500">
                      {cmd.costumes?.nom ?? "Costume"} ×{" "}
                      {cmd.quantite_costumes ?? 0}
                      {" · "}
                      {cmd.date_debut ?? "?"} → {cmd.date_fin ?? "?"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PageShell>
    </>
  );
}
