"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createCommande,
  previewCommandeBesoins,
  updateCommande,
} from "@/app/actions/commandes";
import { BesoinsPiecesTable } from "@/components/BesoinsPiecesTable";
import { Button, Field, Select, TextInput } from "@/components/ui";
import {
  COMMANDE_STATUTS,
  COMMANDE_STATUT_LABELS,
  type Commande,
  type Costume,
  type PieceBesoin,
} from "@/types/database";

type Props = {
  costumes: Pick<Costume, "id" | "nom" | "theme">[];
  commande?: Commande;
};

export function CommandeForm({ costumes, commande }: Props) {
  const isEdit = Boolean(commande);
  const [clientNom, setClientNom] = useState(commande?.client_nom ?? "");
  const [costumeId, setCostumeId] = useState(commande?.costume_id ?? "");
  const [quantite, setQuantite] = useState(
    Number(commande?.quantite_costumes ?? 1),
  );
  const [dateDebut, setDateDebut] = useState(commande?.date_debut ?? "");
  const [dateFin, setDateFin] = useState(commande?.date_fin ?? "");
  const [statut, setStatut] = useState(commande?.statut ?? "brouillon");
  const [besoins, setBesoins] = useState<PieceBesoin[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!costumeId || !dateDebut || !dateFin || quantite < 1) {
      setBesoins([]);
      setPreviewError(null);
      return;
    }

    const handle = window.setTimeout(() => {
      startTransition(async () => {
        const result = await previewCommandeBesoins({
          costumeId,
          quantiteCostumes: quantite,
          dateDebut,
          dateFin,
          excludeCommandeId: commande?.id,
        });
        setBesoins(result.besoins);
        setPreviewError(result.error ?? null);
      });
    }, 250);

    return () => window.clearTimeout(handle);
  }, [
    costumeId,
    quantite,
    dateDebut,
    dateFin,
    commande?.id,
  ]);

  const action = isEdit
    ? updateCommande.bind(null, commande!.id)
    : createCommande;

  return (
    <div className="space-y-8">
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <Field label="Client *">
          <TextInput
            name="client_nom"
            required
            value={clientNom}
            onChange={(e) => setClientNom(e.target.value)}
            placeholder="Nom du client / production"
          />
        </Field>
        <Field label="Costume *">
          <Select
            name="costume_id"
            required
            value={costumeId}
            onChange={(e) => setCostumeId(e.target.value)}
          >
            <option value="" disabled>
              Choisir…
            </option>
            {costumes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
                {c.theme ? ` (${c.theme})` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Quantité de costumes *">
          <TextInput
            name="quantite_costumes"
            type="number"
            min={1}
            required
            value={quantite}
            onChange={(e) => setQuantite(Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Statut">
          <Select
            name="statut"
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
          >
            {COMMANDE_STATUTS.map((s) => (
              <option key={s} value={s}>
                {COMMANDE_STATUT_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date début *">
          <TextInput
            name="date_debut"
            type="date"
            required
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
          />
        </Field>
        <Field label="Date fin *">
          <TextInput
            name="date_fin"
            type="date"
            required
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit">
            {isEdit ? "Enregistrer la commande" : "Créer la commande"}
          </Button>
        </div>
      </form>

      <div>
        {pending ? (
          <p className="mb-2 text-sm text-zinc-500">Calcul du besoin…</p>
        ) : null}
        {previewError ? (
          <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            {previewError}
          </p>
        ) : null}
        <BesoinsPiecesTable besoins={besoins} />
        <p className="mt-2 text-xs text-zinc-500">
          Besoin = quantité_par_costume × quantité_costumes, regroupé par pièce.
          Les commandes chevauchant ces dates réduisent le stock disponible.
        </p>
      </div>
    </div>
  );
}
