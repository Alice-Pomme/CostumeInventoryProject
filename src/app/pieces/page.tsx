export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { PiecesInventory } from "@/components/PiecesInventory";
import { PageShell } from "@/components/ui";

export default async function PiecesPage() {
  const supabase = await createClient();
  const { data: pieces, error } = await supabase
    .from("pieces")
    .select("id, nom, categorie, stock_total, photo_url, notes")
    .order("nom");

  return (
    <>
      <AppNav />
      <PageShell
        title="Pièces"
        description="Inventaire des pièces : nom, catégorie, stock total, photo et notes."
      >
        {error ? (
          <p className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            Impossible de charger les pièces : {error.message}
          </p>
        ) : null}

        <PiecesInventory pieces={pieces ?? []} />
      </PageShell>
    </>
  );
}
