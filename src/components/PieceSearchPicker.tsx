"use client";

import { useMemo, useState } from "react";
import { TextInput } from "@/components/ui";

export type PiecePickOption = {
  id: string;
  nom: string;
  categorie: string | null;
};

type Props = {
  pieces: PiecePickOption[];
  /** checkbox name for multi-select create form */
  name?: string;
  /** single select: controlled value + onChange */
  mode?: "multi" | "single";
  value?: string;
  onChange?: (pieceId: string) => void;
  emptyLabel?: string;
};

/**
 * Type-to-search pieces with optional category filter.
 * Empty category = search all categories.
 */
export function PieceSearchPicker({
  pieces,
  name = "piece_ids",
  mode = "multi",
  value = "",
  onChange,
  emptyLabel = "Aucune pièce ne correspond.",
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of pieces) {
      const c = (p.categorie ?? "").trim();
      if (c) set.add(c);
    }
    return [...set].sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base" }),
    );
  }, [pieces]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cat = category.trim().toLowerCase();
    return pieces.filter((p) => {
      if (cat) {
        const pc = (p.categorie ?? "").trim().toLowerCase();
        if (pc !== cat) return false;
      }
      if (!q) return true;
      const hay = `${p.nom} ${p.categorie ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pieces, query, category]);

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Rechercher
          </span>
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom de pièce…"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Catégorie
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mode === "multi"
        ? [...selectedIds].map((id) => (
            <input key={id} type="hidden" name={name} value={id} />
          ))
        : null}

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyLabel}</p>
      ) : mode === "multi" ? (
        <ul className="max-h-56 space-y-2 overflow-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
          {filtered.map((p) => {
            const checked = selectedIds.has(p.id);
            return (
              <li key={p.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => toggleSelected(p.id, e.target.checked)}
                  id={`pick-${p.id}`}
                  className="h-4 w-4"
                />
                <label htmlFor={`pick-${p.id}`} className="cursor-pointer">
                  {p.nom}
                  {p.categorie ? (
                    <span className="text-zinc-500"> ({p.categorie})</span>
                  ) : null}
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="max-h-56 space-y-1 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-700">
          {filtered.map((p) => {
            const selected = value === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onChange?.(p.id)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                    selected
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span>{p.nom}</span>
                  {p.categorie ? (
                    <span
                      className={`text-xs ${selected ? "opacity-80" : "text-zinc-500"}`}
                    >
                      {p.categorie}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {mode === "single" ? (
        <input type="hidden" name="piece_id" value={value} required />
      ) : null}
      <p className="text-xs text-zinc-500">
        {filtered.length} / {pieces.length} pièce
        {pieces.length > 1 ? "s" : ""}
        {mode === "multi" && selectedIds.size > 0
          ? ` · ${selectedIds.size} sélectionnée${selectedIds.size > 1 ? "s" : ""}`
          : ""}
      </p>
    </div>
  );
}
