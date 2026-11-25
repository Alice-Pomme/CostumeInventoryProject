export const instant = false;

import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { PieceEditForm } from "@/components/PieceEditForm";
import { PageShell } from "@/components/ui";
import { createServiceClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type PieceRow = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number | null;
  photo_url: string | null;
  notes: string | null;
};

type Props = {
  params: Promise<{ id: string }>;
};

function sanitizePiece(row: Record<string, unknown>): PieceRow | null {
  if (typeof row.id !== "string" || typeof row.nom !== "string") return null;
  return {
    id: row.id,
    nom: row.nom,
    categorie: typeof row.categorie === "string" ? row.categorie : null,
    stock_total:
      typeof row.stock_total === "number"
        ? row.stock_total
        : row.stock_total == null
          ? null
          : Number(row.stock_total) || 0,
    photo_url: typeof row.photo_url === "string" ? row.photo_url : null,
    notes: typeof row.notes === "string" ? row.notes : null,
  };
}

export default async function PieceDetailPage({ params }: Props) {
  await connection();
  const { id } = await params;

  if (!hasSupabaseEnv()) {
    return (
      <>
        <AppNav />
        <PageShell title="Pièce">
          <p className="text-sm text-red-600">
            Connexion Supabase indisponible. Vérifiez SUPABASE_URL et
            SUPABASE_SERVICE_ROLE_KEY.
          </p>
          <Link href="/pieces" className="mt-4 inline-block text-sm underline">
            ← Retour aux pièces
          </Link>
        </PageShell>
      </>
    );
  }

  let piece: PieceRow | null = null;
  let categories: string[] = [];
  let errorMessage: string | null = null;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("pieces")
      .select("id, nom, categorie, stock_total, photo_url, notes")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      errorMessage = String(error.message || "Erreur Supabase");
    } else if (data) {
      piece = sanitizePiece(data as Record<string, unknown>);
      if (!piece) errorMessage = "Données de pièce invalides.";
    }

    const { data: catRows } = await supabase
      .from("pieces")
      .select("categorie");
    const seen = new Set<string>();
    for (const row of catRows ?? []) {
      const cat =
        typeof row.categorie === "string" ? row.categorie.trim() : "";
      if (!cat) continue;
      const key = cat.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      categories.push(cat);
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Erreur inattendue.";
    console.error("PieceDetailPage load failed:", err);
  }

  if (errorMessage) {
    return (
      <>
        <AppNav />
        <PageShell title="Pièce">
          <p className="text-sm text-red-600">{errorMessage}</p>
          <Link href="/pieces" className="mt-4 inline-block text-sm underline">
            ← Retour aux pièces
          </Link>
        </PageShell>
      </>
    );
  }
  if (!piece) notFound();

  const safePiece = JSON.parse(JSON.stringify(piece)) as PieceRow;
  const safeCategories = JSON.parse(JSON.stringify(categories)) as string[];

  return (
    <>
      <AppNav />
      <PageShell
        title={safePiece.nom}
        description="Modifier la pièce et sa photo."
        actions={
          <Link
            href="/pieces"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            ← Retour aux pièces
          </Link>
        }
      >
        <PieceEditForm piece={safePiece} categories={safeCategories} />
      </PageShell>
    </>
  );
}
