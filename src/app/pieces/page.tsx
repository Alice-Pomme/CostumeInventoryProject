import { AppNav } from "@/components/AppNav";
import { PiecesClient } from "@/components/PiecesClient";
import { PageShell } from "@/components/ui";

/**
 * No server data fetch here. RSC + connection()/Supabase on this route kept
 * throwing digest 366692239 on the published host. The client loads via /api/pieces.
 */
export default function PiecesPage() {
  return (
    <>
      <AppNav />
      <PageShell
        title="Pièces"
        description="Inventaire des pièces : nom, catégorie, stock total et notes."
      >
        <PiecesClient />
      </PageShell>
    </>
  );
}
