"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CostumeHabillagePanel } from "@/components/CostumeHabillagePanel";
import { PhotoDropzone } from "@/components/PhotoDropzone";
import { PieceSearchPicker } from "@/components/PieceSearchPicker";
import {
  Button,
  Field,
  PageShell,
  TextArea,
  TextInput,
} from "@/components/ui";
import { safeImageSrc } from "@/lib/safe-image-url";
import type { CostumePieceWithPiece } from "@/types/database";

type Costume = {
  id: string;
  nom: string;
  theme: string | null;
  description: string | null;
  photo_url: string | null;
  nombre?: number | null;
};

type PieceOption = {
  id: string;
  nom: string;
  categorie: string | null;
};

export function CostumeEditClient({ costumeId }: { costumeId: string }) {
  const router = useRouter();
  const [costume, setCostume] = useState<Costume | null>(null);
  const [links, setLinks] = useState<CostumePieceWithPiece[]>([]);
  const [allPieces, setAllPieces] = useState<PieceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const [addFormKey, setAddFormKey] = useState(0);
  const [selectedPieceId, setSelectedPieceId] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/costumes/${costumeId}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const body = (await res.json()) as {
      ok?: boolean;
      costume?: Costume;
      links?: CostumePieceWithPiece[];
      pieces?: PieceOption[];
      message?: string;
    };
    if (!body.ok || !body.costume) {
      setCostume(null);
      setError(body.message || "Impossible de charger le costume.");
      return;
    }
    setCostume(body.costume);
    setLinks(Array.isArray(body.links) ? body.links : []);
    setAllPieces(Array.isArray(body.pieces) ? body.pieces : []);
    setError(null);
  }, [costumeId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch {
        if (!cancelled) setError("Impossible de joindre l’API costume.");
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
        const res = await fetch(`/api/costumes/${costumeId}`, {
          method: "PATCH",
          body: formData,
          credentials: "same-origin",
        });
        const body = (await res.json()) as { ok?: boolean; message?: string };
        if (!body.ok) {
          setSaveError(body.message || "Échec de l’enregistrement.");
          return;
        }
        setFormKey((k) => k + 1);
        await refresh();
      } catch {
        setSaveError("Impossible d’enregistrer le costume.");
      }
    });
  }

  function onAddPiece(formData: FormData) {
    setSaveError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/costumes/${costumeId}/pieces`, {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        });
        const body = (await res.json()) as { ok?: boolean; message?: string };
        if (!body.ok) {
          setSaveError(body.message || "Impossible de lier la pièce.");
          return;
        }
        setSelectedPieceId("");
        setAddFormKey((k) => k + 1);
        await refresh();
      } catch {
        setSaveError("Impossible de lier la pièce.");
      }
    });
  }

  function onDelete() {
    if (
      !confirm(
        `Supprimer définitivement le costume « ${costume?.nom ?? ""} » ? Cette action est irréversible.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/costumes/${costumeId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const body = (await res.json()) as { ok?: boolean; message?: string };
      if (!body.ok) {
        setSaveError(body.message || "Échec de la suppression.");
        return;
      }
      router.push("/costumes");
    });
  }

  if (loading) {
    return (
      <PageShell title="Modifier le costume" description="Chargement…">
        <p className="text-sm text-zinc-500">Chargement…</p>
      </PageShell>
    );
  }

  if (error || !costume) {
    return (
      <PageShell title="Modifier le costume">
        <p className="text-sm text-red-600 dark:text-red-300">
          {error || "Costume introuvable."}
        </p>
        <Link href="/costumes" className="mt-4 inline-block text-sm underline">
          ← Retour aux costumes
        </Link>
      </PageShell>
    );
  }

  const linkedIds = new Set(links.map((l) => l.piece_id));
  const availablePieces = allPieces.filter((p) => !linkedIds.has(p.id));

  return (
    <PageShell
      title={`Modifier — ${costume.nom}`}
      description="Champs du costume, pièces et ordre d’habillage."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/costumes/${costume.id}`}
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            Voir la fiche
          </Link>
          <Link
            href="/costumes"
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            ← Retour
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

      <form
        id="costume-edit-form"
        key={formKey}
        action={onSave}
        className="mb-10 grid gap-4 sm:grid-cols-2"
      >
        <Field label="Nom *">
          <TextInput name="nom" required defaultValue={costume.nom} />
        </Field>
        <Field label="Thème">
          <TextInput name="theme" defaultValue={costume.theme ?? ""} />
        </Field>
        <Field label="Nombre de costumes">
          <TextInput
            name="nombre"
            type="number"
            min={1}
            defaultValue={costume.nombre ?? 1}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description / note">
            <TextArea
              name="description"
              defaultValue={costume.description ?? ""}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Photo
          </h3>
          <PhotoDropzone
            existingUrl={safeImageSrc(costume.photo_url)}
            required={false}
          />
        </div>
      </form>

      <CostumeHabillagePanel
        costumeId={costume.id}
        costumeNom={costume.nom}
        theme={costume.theme}
        description={costume.description}
        nombre={costume.nombre}
        items={links}
        onChanged={refresh}
        showFiche={false}
      />

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Ajouter une pièce
        </h2>
        {availablePieces.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Toutes les pièces sont déjà liées, ou aucune pièce n’existe.{" "}
            <Link href="/pieces" className="underline">
              Créer une pièce
            </Link>
          </p>
        ) : (
          <form
            key={addFormKey}
            action={onAddPiece}
            className="grid max-w-2xl gap-4"
          >
            <PieceSearchPicker
              pieces={availablePieces}
              mode="single"
              value={selectedPieceId}
              onChange={setSelectedPieceId}
            />
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Quantité par costume">
                <TextInput
                  name="quantite_par_costume"
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="w-28"
                />
              </Field>
              <div className="min-w-[12rem] flex-1">
                <Field label="Note d’habillage (optionnel)">
                  <TextInput
                    name="notes"
                    placeholder="Ex. enfiler avant la jupe"
                  />
                </Field>
              </div>
              <Button type="submit" disabled={pending || !selectedPieceId}>
                Lier la pièce
              </Button>
            </div>
          </form>
        )}
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <Button type="submit" form="costume-edit-form" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          onClick={onDelete}
        >
          Supprimer le costume
        </Button>
      </div>
    </PageShell>
  );
}
