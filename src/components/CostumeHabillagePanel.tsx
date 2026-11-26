"use client";

import { useOptimistic, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { CostumePieceWithPiece } from "@/types/database";
import { FicheHabillage } from "@/components/FicheHabillage";
import { SafeImage } from "@/components/SafeImage";
import { Button, Field, TextArea, TextInput } from "@/components/ui";

function SortableRow({
  item,
  costumeId,
  onChanged,
}: {
  item: CostumePieceWithPiece;
  costumeId: string;
  onChanged?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const [, startTransition] = useTransition();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function onUpdateLink(formData: FormData) {
    startTransition(async () => {
      await fetch(`/api/costumes/${costumeId}/pieces/${item.id}`, {
        method: "PATCH",
        body: formData,
        credentials: "same-origin",
      });
      onChanged?.();
    });
  }

  function onRemove() {
    startTransition(async () => {
      await fetch(`/api/costumes/${costumeId}/pieces/${item.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      onChanged?.();
    });
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`border-b border-zinc-200 py-3 dark:border-zinc-800 ${
        isDragging ? "bg-zinc-50 opacity-80 dark:bg-zinc-900" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {item.ordre_habillage ?? "—"}
        </span>
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-zinc-400 hover:text-zinc-700 active:cursor-grabbing dark:hover:text-zinc-200"
          aria-label={`Déplacer ${item.pieces?.nom ?? "la pièce"}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <SafeImage
          src={item.pieces?.photo_url}
          className="h-10 w-10 rounded object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            {item.pieces?.nom ?? "Pièce inconnue"}
          </p>
          <p className="text-xs text-zinc-500">
            {item.pieces?.categorie ?? "Sans catégorie"}
          </p>
        </div>
        <Button
          type="button"
          variant="danger"
          aria-label="Retirer"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <form
        action={onUpdateLink}
        className="mt-3 ml-11 grid gap-3 sm:grid-cols-[5rem_1fr_auto]"
      >
        <Field label="Qté">
          <TextInput
            name="quantite_par_costume"
            type="number"
            min={1}
            defaultValue={item.quantite_par_costume ?? 1}
            className="w-20"
          />
        </Field>
        <Field label="Note d’habillage (ce costume seulement)">
          <TextArea
            name="notes"
            rows={2}
            defaultValue={item.notes ?? ""}
            placeholder="Ex. boutonner avant d’ajouter la ceinture"
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="secondary">
            OK
          </Button>
        </div>
      </form>
    </li>
  );
}

export function CostumeHabillagePanel({
  costumeId,
  costumeNom,
  theme,
  description,
  nombre,
  items,
  onChanged,
  showFiche = true,
}: {
  costumeId: string;
  costumeNom: string;
  theme?: string | null;
  description?: string | null;
  nombre?: number | null;
  items: CostumePieceWithPiece[];
  onChanged?: () => void;
  showFiche?: boolean;
}) {
  const sorted = [...items].sort(
    (a, b) => (a.ordre_habillage ?? 0) - (b.ordre_habillage ?? 0),
  );
  const [optimistic, setOptimistic] = useOptimistic(sorted);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = optimistic.findIndex((i) => i.id === active.id);
    const newIndex = optimistic.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(optimistic, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      ordre_habillage: idx + 1,
    }));

    startTransition(async () => {
      setOptimistic(next);
      await fetch(`/api/costumes/${costumeId}/pieces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "reorder",
          orderedLinkIds: next.map((i) => i.id),
        }),
      });
      onChanged?.();
    });
  }

  return (
    <div className="space-y-10">
      <section className="print:hidden">
        <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Ordre d’habillage
        </h2>
        <p className="mb-4 text-sm text-zinc-500">
          Glissez les pièces pour définir l’ordre (1, 2, 3…). Chaque note
          d’habillage est liée à cette pièce dans ce costume uniquement.
          {pending ? " Enregistrement…" : ""}
        </p>

        {optimistic.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Aucune pièce liée. Ajoutez-en ci-dessous.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={optimistic.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul>
                {optimistic.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    costumeId={costumeId}
                    onChanged={onChanged}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </section>

      {showFiche ? (
        <FicheHabillage
          costumeNom={costumeNom}
          theme={theme}
          description={description}
          nombre={nombre}
          items={optimistic}
        />
      ) : null}
    </div>
  );
}
