"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PhotoDropzone } from "@/components/PhotoDropzone";
import { Button, Field, TextArea, TextInput } from "@/components/ui";

type CostumeRow = {
  id: string;
  nom: string;
  theme: string | null;
  photo_url: string | null;
  description: string | null;
};

type PieceOption = {
  id: string;
  nom: string;
  categorie: string | null;
};

export function CostumesClient() {
  const router = useRouter();
  const [costumes, setCostumes] = useState<CostumeRow[]>([]);
  const [pieces, setPieces] = useState<PieceOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

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
          warning?: string;
          costume?: CostumeRow;
        };
        if (!body.ok || !body.costume) {
          setSaveError(body.message || "Échec de la création.");
          return;
        }
        setFormKey((k) => k + 1);
        router.push(`/costumes/${body.costume.id}`);
      } catch {
        setSaveError("Impossible de créer le costume.");
      }
    });
  }

  const alert = loadError || saveError;

  return (
    <div className="space-y-10">
      {alert ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {alert}
        </p>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Nouveau costume
        </h2>
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
            />
          </Field>
          <Field label="Thème">
            <TextInput name="theme" placeholder="Ex. Conte de fées" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <TextArea
                name="description"
                placeholder="Description du costume"
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
              <ul className="max-h-48 space-y-2 overflow-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                {pieces.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="piece_ids"
                      value={p.id}
                      id={`piece-${p.id}`}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`piece-${p.id}`} className="cursor-pointer">
                      {p.nom}
                      {p.categorie ? (
                        <span className="text-zinc-500"> ({p.categorie})</span>
                      ) : null}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending}>
              <Plus className="mr-1.5 h-4 w-4" />
              {pending ? "Création…" : "Créer le costume"}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Liste ({loading ? "…" : costumes.length})
        </h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Chargement…</p>
        ) : costumes.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun costume pour le moment.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {costumes.map((costume) => (
              <li key={costume.id}>
                <Link
                  href={`/costumes/${costume.id}`}
                  className="block py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {costume.nom}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {costume.theme || "Sans thème"}
                    {costume.description
                      ? ` · ${costume.description.slice(0, 80)}`
                      : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
