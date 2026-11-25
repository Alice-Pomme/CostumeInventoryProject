export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { AppNav } from "@/components/AppNav";
import { PiecesInventory } from "@/components/PiecesInventory";
import { PageShell } from "@/components/ui";

export default async function PiecesPage() {
  let pieces: {
    id: string;
    nom: string;
    categorie: string | null;
    stock_total: number | null;
    photo_url: string | null;
    notes: string | null;
  }[] = [];
  let errorMessage: string | null = null;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pieces")
      .select("id, nom, categorie, stock_total, photo_url, notes")
      .order("nom");
    pieces = data ?? [];
    if (error) errorMessage = error.message;
  }

  return (
    <>
      <AppNav />
      <PageShell
        title="Pièces"
        description="Inventaire des pièces : nom, catégorie, stock total, photo et notes."
      >
        {errorMessage ? (
          <p className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            Impossible de charger les pièces : {errorMessage}
          </p>
        ) : null}

        <PiecesInventory pieces={pieces} />
      </PageShell>
    </>
  );
}
