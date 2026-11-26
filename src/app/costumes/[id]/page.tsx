import { AppNav } from "@/components/AppNav";
import { CostumePrintClient } from "@/components/CostumePrintClient";

type Props = { params: Promise<{ id: string }> };

/** Printable costume fiche + ordre d’assemblage. */
export default async function CostumeDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <div className="print:hidden">
        <AppNav />
      </div>
      <CostumePrintClient costumeId={id} />
    </>
  );
}
