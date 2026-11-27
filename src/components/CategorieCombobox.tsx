"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { TextInput } from "@/components/ui";

type Props = {
  name?: string;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
};

/**
 * Combobox for catégorie: open a dropdown of existing values, or type a new one.
 */
export function CategorieCombobox({
  name = "categorie",
  options,
  defaultValue = "",
  placeholder = "Choisir ou saisir une catégorie",
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const unique = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const opt of options) {
      const trimmed = opt.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trimmed);
    }
    return out.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [options]);

  const query = value.trim().toLowerCase();
  const filtered = query
    ? unique.filter((opt) => opt.toLowerCase().includes(query))
    : unique;
  const exactMatch = unique.some((opt) => opt.toLowerCase() === query);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <div className="flex gap-1">
        <TextInput
          name={name}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          role="combobox"
          className="flex-1"
        />
        <button
          type="button"
          aria-label="Afficher les catégories"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-2 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-md dark:border-zinc-700 dark:bg-zinc-950"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-zinc-500">
              {query
                ? `Aucune suggestion — « ${value.trim()} » sera une nouvelle catégorie`
                : "Aucune catégorie encore — saisissez-en une"}
            </li>
          ) : (
            filtered.map((opt) => (
              <li key={opt} role="option" aria-selected={opt === value}>
                <button
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-900"
                  onClick={() => {
                    setValue(opt);
                    setOpen(false);
                  }}
                >
                  {opt}
                </button>
              </li>
            ))
          )}
          {query && !exactMatch ? (
            <li className="border-t border-zinc-100 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800">
              Nouvelle catégorie : « {value.trim()} »
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
