"use client";

import { useId, useMemo, useState } from "react";
import { TextInput } from "@/components/ui";

type Props = {
  name?: string;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
};

/**
 * Combobox: pick an existing catégorie or type a new one.
 */
export function CategorieCombobox({
  name = "categorie",
  options,
  defaultValue = "",
  placeholder = "Ex. Haut",
}: Props) {
  const listId = useId();
  const [value, setValue] = useState(defaultValue);

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
  const showCreateHint = query.length > 0 && !exactMatch;

  return (
    <div className="relative">
      <TextInput
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        list={listId}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
      />
      <datalist id={listId}>
        {unique.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
      {filtered.length > 0 || showCreateHint ? (
        <p className="mt-1 text-xs text-zinc-500">
          {showCreateHint
            ? `Nouvelle catégorie : « ${value.trim()} »`
            : `${filtered.length} suggestion${filtered.length > 1 ? "s" : ""} existante${filtered.length > 1 ? "s" : ""}`}
        </p>
      ) : unique.length === 0 ? (
        <p className="mt-1 text-xs text-zinc-500">
          Aucune catégorie encore — saisissez-en une nouvelle.
        </p>
      ) : null}
    </div>
  );
}
