import { AppNav } from "@/components/AppNav";
import { CostumeEditClient } from "@/components/CostumeEditClient";

type Props = { params: Promise<{ id: string }> };

/** Edit costume fields, pieces, and ordre d’habillage. */
export default async function CostumeEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <AppNav />
      <CostumeEditClient costumeId={id} />
    </>
  );
}
