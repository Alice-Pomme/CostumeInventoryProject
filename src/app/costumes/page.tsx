import { AppNav } from "@/components/AppNav";
import { CostumesClient } from "@/components/CostumesClient";

/** Shell — list/create via authenticated /api/costumes. */
export default function CostumesPage() {
  return (
    <>
      <AppNav />
      <CostumesClient />
    </>
  );
}
