"use client";

import { Printer } from "lucide-react";
import type { CostumePieceWithPiece } from "@/types/database";
import { SafeImage } from "@/components/SafeImage";
import { Button } from "@/components/ui";

export function FicheHabillage({
  costumeNom,
  theme,
  description,
  nombre,
  items,
}: {
  costumeNom: string;
  theme?: string | null;
  description?: string | null;
  nombre?: number | null;
  items: CostumePieceWithPiece[];
}) {
  const ordered = [...items].sort(
    (a, b) => (a.ordre_habillage ?? 0) - (b.ordre_habillage ?? 0),
  );

  return (
    <section
      id="fiche-habillage"
      className="fiche-habillage rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 print:mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Fiche d’habillage
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {costumeNom}
          </h2>
          {theme ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Thème : {theme}
            </p>
          ) : null}
          {nombre != null && nombre > 0 ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Nombre : {nombre}
            </p>
          ) : null}
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="mr-1.5 h-4 w-4" />
          Imprimer
        </Button>
      </div>

      {ordered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucune pièce — l’ordre d’habillage apparaîtra ici.
        </p>
      ) : (
        <ol className="space-y-3">
          {ordered.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-4 border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-900"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {item.ordre_habillage ?? "—"}
              </span>
              <SafeImage
                src={item.pieces?.photo_url}
                className="h-14 w-14 rounded object-cover print:h-12 print:w-12"
                fallback={
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-400 dark:bg-zinc-900 print:h-12 print:w-12">
                    Photo
                  </div>
                }
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {item.pieces?.nom ?? "Pièce inconnue"}
                </p>
                <p className="text-sm text-zinc-500">
                  {item.pieces?.categorie ?? "Sans catégorie"}
                  {" · "}
                  Qté {item.quantite_par_costume ?? 1}
                </p>
                {item.notes ? (
                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {item.notes}
                  </p>
                ) : null}
              </div>
              <div className="hidden h-5 w-5 shrink-0 rounded border border-zinc-300 print:block" />
            </li>
          ))}
        </ol>
      )}

      <p className="mt-6 hidden text-xs text-zinc-400 print:block">
        Inventaire costumes — ordre d’habillage ({ordered.length} étape
        {ordered.length > 1 ? "s" : ""})
      </p>
    </section>
  );
}
