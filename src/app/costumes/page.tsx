import { AppNav } from "@/components/AppNav";
import { CostumesClient } from "@/components/CostumesClient";
import { PageShell } from "@/components/ui";

/** Shell — list/create via authenticated /api/costumes. */
export default function CostumesPage() {
  return (
    <>
      <AppNav />
      <PageShell
        title="Costumes"
        description="Assembler des costumes à partir des pièces."
      >
        <CostumesClient />
      </PageShell>
    </>
  );
}
