"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CategorieCombobox } from "@/components/CategorieCombobox";
import { PhotoDropzone } from "@/components/PhotoDropzone";
import { Button, Field, PageShell, TextArea, TextInput } from "@/components/ui";
import { safeImageSrc } from "@/lib/safe-image-url";

type Piece = {
  id: string;
  nom: string;
  categorie: string | null;
  stock_total: number;
  notes: string | null;
  photo_url: string | null;
};

export function PieceDetailClient({ pieceId }: { pieceId: string }) {
  const router = useRouter();
  const [piece, setPiece] = useState<Piece | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/pieces/${pieceId}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const body = (await res.json()) as {
      ok?: boolean;
      piece?: Piece;
      categories?: string[];
      message?: string;
    };
    if (!body.ok || !body.piece) {
      setPiece(null);
      setError(body.message || "Impossible de charger la pièce.");
      return;
    }
    setPiece(body.piece);
    setCategories(Array.isArray(body.categories) ? body.categories : []);
    setError(null);
  }, [pieceId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch {
        if (!cancelled) setError("Impossible de joindre l’API pièce.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  function onSave(formData: FormData) {
    setSaveError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/pieces/${pieceId}`, {
          method: "PATCH",
          body: formData,
          credentials: "same-origin",
        });
        const body = (await res.json()) as { ok?: boolean; message?: string };
        if (!body.ok) {
          setSaveError(body.message || "Échec de l’enregistrement.");
          return;
        }
        await refresh();
        setEditing(false);
      } catch {
        setSaveError("Impossible d’enregistrer la pièce.");
      }
    });
  }

  function onDelete() {
    if (!confirm("Supprimer cette pièce ?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/pieces/${pieceId}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const body = (await res.json()) as { ok?: boolean; message?: string };
        if (!body.ok) {
          setSaveError(body.message || "Échec de la suppression.");
          return;
        }
        router.push("/pieces");
        router.refresh();
      } catch {
        setSaveError("Impossible de supprimer la pièce.");
      }
    });
  }

  if (loading) {
    return (
      <PageShell title="Pièce" description="Chargement…">
        <p className="text-sm text-zinc-500">Chargement…</p>
      </PageShell>
    );
  }

  if (error || !piece) {
    return (
      <PageShell title="Pièce">
        <p className="text-sm text-red-600 dark:text-red-300">
          {error || "Pièce introuvable."}
        </p>
        <Link href="/pieces" className="mt-4 inline-block text-sm underline">
          ← Retour aux pièces
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={piece.nom}
      description="Fiche pièce."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {!editing ? (
            <Button type="button" onClick={() => setEditing(true)}>
              Modifier
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditing(false);
                setSaveError(null);
              }}
            >
              Annuler
            </Button>
          )}
          <Link
            href="/pieces"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            ← Retour aux pièces
          </Link>
        </div>
      }
    >
      {saveError ? (
        <p
          role="alert"
          className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {saveError}
        </p>
      ) : null}

      {editing ? (
        <form action={onSave} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom *">
            <TextInput
              name="nom"
              required
              defaultValue={piece.nom}
              autoComplete="off"
            />
          </Field>
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Catégorie
            </span>
            <CategorieCombobox
              options={categories}
              defaultValue={piece.categorie ?? ""}
            />
          </div>
          <Field label="Stock total">
            <TextInput
              name="stock_total"
              type="number"
              min={0}
              defaultValue={piece.stock_total}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <TextArea name="notes" defaultValue={piece.notes ?? ""} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Photo
            </h2>
            <PhotoDropzone
              existingUrl={safeImageSrc(piece.photo_url)}
              required={false}
            />
          </div>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={onDelete}
            >
              Supprimer la pièce
            </Button>
          </div>
        </form>
      ) : (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Catégorie</dt>
            <dd>{piece.categorie || "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Stock total</dt>
            <dd>{piece.stock_total}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-zinc-500">Notes</dt>
            <dd>{piece.notes || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="mb-2 text-zinc-500">Photo</dt>
            <dd>
              {safeImageSrc(piece.photo_url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={safeImageSrc(piece.photo_url)!}
                  alt=""
                  className="max-h-48 rounded-md object-contain"
                />
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      )}
    </PageShell>
  );
}
