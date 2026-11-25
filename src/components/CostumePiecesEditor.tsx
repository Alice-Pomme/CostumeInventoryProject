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
import {
  removePieceFromCostume,
  reorderCostumePieces,
  updateCostumePiece,
} from "@/app/actions/costumes";
import { Button, Field, TextInput } from "@/components/ui";

function SortableRow({
  item,
  costumeId,
}: {
  item: CostumePieceWithPiece;
  costumeId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-center gap-3 border-b border-zinc-200 py-3 dark:border-zinc-800 ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        aria-label="Réordonner"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          {item.pieces?.nom ?? "Pièce inconnue"}
        </p>
        <p className="text-xs text-zinc-500">
          {item.pieces?.categorie ?? "Sans catégorie"} · ordre{" "}
          {item.ordre_habillage ?? "—"}
        </p>
      </div>
      <form
        action={updateCostumePiece.bind(null, item.id, costumeId)}
        className="flex items-end gap-2"
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
        <Button type="submit" variant="secondary">
          OK
        </Button>
      </form>
      <form action={removePieceFromCostume.bind(null, item.id, costumeId)}>
        <Button type="submit" variant="danger" aria-label="Retirer">
          <Trash2 className="h-4 w-4" />
        </Button>
      </form>
    </li>
  );
}

export function CostumePiecesEditor({
  costumeId,
  items,
}: {
  costumeId: string;
  items: CostumePieceWithPiece[];
}) {
  const [optimistic, setOptimistic] = useOptimistic(items);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor),
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
      await reorderCostumePieces(
        costumeId,
        next.map((i) => i.id),
      );
    });
  }

  if (optimistic.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Aucune pièce liée. Ajoutez-en ci-dessous.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={optimistic.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="divide-y-0">
          {optimistic.map((item) => (
            <SortableRow key={item.id} item={item} costumeId={costumeId} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
