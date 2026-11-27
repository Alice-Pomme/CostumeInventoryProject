import { AppNav } from "@/components/AppNav";
import { PiecesClient } from "@/components/PiecesClient";
import { PageShell } from "@/components/ui";

/**
 * Static shell — data loads in the browser via GET /api/pieces.
 * The published host injects Cursor identity onto the Request for route
 * handlers; RSC headers() was seeing missing_header and blocking Supabase.
 */
export default function PiecesPage() {
  return (
    <>
      <AppNav />
      <PageShell
        title="Pièces"
        description="Inventaire des pièces : nom, catégorie, stock, photo et notes."
      >
        <PiecesClient />
      </PageShell>
    </>
  );
}
