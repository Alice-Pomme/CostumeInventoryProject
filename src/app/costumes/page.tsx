import Link from "next/link";
import { Plus } from "lucide-react";
import { createCostume } from "@/app/actions/costumes";
import { AppNav } from "@/components/AppNav";
import { Button, Field, PageShell, TextArea, TextInput } from "@/components/ui";
import { loadTableRows } from "@/lib/supabase/load";

type CostumeRow = {
  id: string;
  nom: string;
  theme: string | null;
  photo_url: string | null;
  description: string | null;
};

export default async function CostumesPage() {
  const { rows: costumes, errorMessage } = await loadTableRows<CostumeRow>(
    (supabase) =>
      supabase
        .from("costumes")
        .select("id, nom, theme, photo_url, description")
        .order("nom"),
  );

  return (
    <>
      <AppNav />
      <PageShell
        title="Costumes"
        description="Assembler des costumes à partir des pièces."
      >
        {errorMessage ? (
          <p className="mb-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            Impossible de charger les costumes : {errorMessage}
          </p>
        ) : null}

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Nouveau costume
          </h2>
          <form action={createCostume} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom *">
              <TextInput name="nom" required placeholder="Ex. Prince charmant" />
            </Field>
            <Field label="Thème">
              <TextInput name="theme" placeholder="Ex. Conte de fées" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <TextArea name="description" placeholder="Description du costume" />
              </Field>
            </div>
            <Field label="URL photo (optionnel)">
              <TextInput name="photo_url" placeholder="https://…" />
            </Field>
            <div className="flex items-end">
              <Button type="submit">
                <Plus className="mr-1.5 h-4 w-4" />
                Créer le costume
              </Button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Liste ({costumes.length})
          </h2>
          {!costumes.length ? (
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
      </PageShell>
    </>
  );
}
