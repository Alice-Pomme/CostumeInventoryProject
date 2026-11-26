import { AppNav } from "@/components/AppNav";
import { CostumeDetailClient } from "@/components/CostumeDetailClient";

type Props = { params: Promise<{ id: string }> };

/** Shell — detail/edit/pieces via /api/costumes/[id]. */
export default async function CostumeDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <div className="print:hidden">
        <AppNav />
      </div>
      <CostumeDetailClient costumeId={id} />
    </>
  );
}
