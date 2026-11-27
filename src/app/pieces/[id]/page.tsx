import { AppNav } from "@/components/AppNav";
import { PieceDetailClient } from "@/components/PieceDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Shell only — detail/edit load via /api/pieces/[id] (Request identity).
 */
export default async function PieceDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <AppNav />
      <PieceDetailClient pieceId={id} />
    </>
  );
}
