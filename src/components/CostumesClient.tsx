"use client";

import { useCallback, useEffect, useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { PhotoDropzone } from "@/components/PhotoDropzone";
import { PieceSearchPicker } from "@/components/PieceSearchPicker";
import { SafeImage } from "@/components/SafeImage";
import { Button, Field, PageShell, TextArea, TextInput } from "@/components/ui";

type CostumeRow = {
  id: string;
  nom: string;
  theme: string | null;
  photo_url: string | null;
  description: string | null;
  nombre?: number;
};

type PieceOption = {
  id: string;
  nom: string;
  categorie: string | null;
};

export function CostumesClient() {
  const router = useRouter();
  const dialogTitleId = useId();
  const [costumes, setCostumes] = useState<CostumeRow[]>([]);
  const [pieces, setPieces] = useState<PieceOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const refresh = useCallback(async () => {
    const [cRes, pRes] = await Promise.all([
      fetch("/api/costumes", { cache: "no-store", credentials: "same-origin" }),
      fetch("/api/pieces", { cache: "no-store", credentials: "same-origin" }),
    ]);
    const cBody = (await cRes.json()) as {
      ok?: boolean;
      costumes?: CostumeRow[];
      message?: string;
    };
    const pBody = (await pRes.json()) as {
      ok?: boolean;
      pieces?: PieceOption[];
    };

    setCostumes(Array.isArray(cBody.costumes) ? cBody.costumes : []);
    setPieces(Array.isArray(pBody.pieces) ? pBody.pieces : []);
    setLoadError(
      cBody.ok
        ? null
        : cBody.message || "Impossible de charger les costumes.",
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch {
        if (!cancelled) setLoadError("Impossible de joindre l’API costumes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    if (!createOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCreateOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createOpen]);

  function openCreate() {
    setSaveError(null);
    setFormKey((k) => k + 1);
    setCreateOpen(true);
  }

  function onSubmit(formData: FormData) {
    setSaveError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/costumes", {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        });
        const body = (await res.json()) as {
          ok?: boolean;
          message?: string;
          costume?: CostumeRow;
        };
        if (!body.ok || !body.costume) {
          setSaveError(body.message || "Échec de la création.");
          return;
        }
        setCreateOpen(false);
        router.push(`/costumes/${body.costume.id}/edit`);
      } catch {
        setSaveError("Impossible de créer le costume.");
      }
    });
  }

  function onDelete(costume: CostumeRow) {
    if (
      !confirm(
        `Supprimer définitivement le costume « ${costume.nom} » ? Cette action est irréversible.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/costumes/${costume.id}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const body = (await res.json()) as { ok?: boolean; message?: string };
        if (!body.ok) {
          setSaveError(body.message || "Échec de la suppression.");
          return;
        }
        await refresh();
      } catch {
        setSaveError("Impossible de supprimer le costume.");
      }
    });
  }

  const alert = loadError || saveError;

  return (
    <PageShell
      title="Costumes"
      description="Assembler des costumes à partir des pièces."
      actions={
        <Button type="button" onClick={openCreate} aria-label="Nouveau costume">
          <Plus className="mr-1.5 h-4 w-4" />
          Nouveau
        </Button>
      }
    >
      {alert ? (
        <p
          role="alert"
          className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {alert}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Chargement…</p>
      ) : costumes.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucun costume pour le moment. Utilisez{" "}
          <button
            type="button"
            onClick={openCreate}
            className="underline underline-offset-2"
          >
            Nouveau
          </button>{" "}
          pour en créer un.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {costumes.map((costume) => (
            <li
              key={costume.id}
              className="flex flex-wrap items-center gap-4 py-4"
            >
              <Link
                href={`/costumes/${costume.id}`}
                className="flex min-w-0 flex-1 items-center gap-4 transition hover:opacity-90"
              >
                <SafeImage
                  src={costume.photo_url}
                  className="h-16 w-16 shrink-0 rounded object-cover"
                  fallback={
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-400 dark:bg-zinc-900">
                      Photo
                    </div>
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {costume.nom}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    Quantité : {costume.nombre ?? 1}
                    {costume.theme ? ` · ${costume.theme}` : ""}
                  </p>
                  {costume.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {costume.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm italic text-zinc-400">
                      Aucune note
                    </p>
                  )}
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/costumes/${costume.id}/edit`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  aria-label={`Modifier ${costume.nom}`}
                  title="Modifier"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <Button
                  type="button"
                  variant="danger"
                  className="!px-2"
                  disabled={pending}
                  onClick={() => onDelete(costume)}
                  aria-label={`Supprimer ${costume.nom}`}
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {createOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2
                id={dialogTitleId}
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              >
                Nouveau costume
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {saveError ? (
              <p
                role="alert"
                className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
              >
                {saveError}
              </p>
            ) : null}

            <form
              key={formKey}
              action={onSubmit}
              className="grid gap-4 sm:grid-cols-2"
            >
              <Field label="Nom *">
                <TextInput
                  name="nom"
                  required
                  placeholder="Ex. Prince charmant"
                  autoComplete="off"
                  autoFocus
                />
              </Field>
              <Field label="Thème">
                <TextInput name="theme" placeholder="Ex. Conte de fées" />
              </Field>
              <Field label="Nombre de costumes">
                <TextInput
                  name="nombre"
                  type="number"
                  min={1}
                  defaultValue={1}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description / note">
                  <TextArea
                    name="description"
                    placeholder="Note ou description du costume"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Photo
                </h3>
                <PhotoDropzone required={false} />
              </div>
              <div className="sm:col-span-2">
                <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Pièces à inclure
                </h3>
                {pieces.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    Aucune pièce disponible.{" "}
                    <Link href="/pieces" className="underline">
                      Créer des pièces
                    </Link>{" "}
                    d’abord, ou ajoutez-les après la création.
                  </p>
                ) : (
                  <PieceSearchPicker pieces={pieces} mode="multi" />
                )}
              </div>
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <Button type="submit" disabled={pending}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {pending ? "Création…" : "Créer le costume"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => setCreateOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
