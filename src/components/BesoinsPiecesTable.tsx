import type { PieceBesoin } from "@/types/database";

export function BesoinsPiecesTable({
  besoins,
  title = "Besoin consolidé en pièces",
}: {
  besoins: PieceBesoin[];
  title?: string;
}) {
  const ruptures = besoins.filter((b) => b.en_rupture).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {title}
        </h3>
        {ruptures > 0 ? (
          <p className="rounded-md bg-red-100 px-2 py-1 text-sm font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
            {ruptures} pièce{ruptures > 1 ? "s" : ""} en pénurie sur ces dates
          </p>
        ) : besoins.length > 0 ? (
          <p className="rounded-md bg-emerald-100 px-2 py-1 text-sm font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            Stock suffisant pour cette période
          </p>
        ) : null}
      </div>

      {besoins.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun besoin calculé.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <th className="py-2 pr-3 font-medium">Pièce</th>
                <th className="py-2 pr-3 font-medium">× costume</th>
                <th className="py-2 pr-3 font-medium">Besoin</th>
                <th className="py-2 pr-3 font-medium">Réservé ailleurs</th>
                <th className="py-2 pr-3 font-medium">Stock</th>
                <th className="py-2 pr-3 font-medium">Dispo.</th>
                <th className="py-2 font-medium">Manque</th>
              </tr>
            </thead>
            <tbody>
              {besoins.map((b) => (
                <tr
                  key={b.piece_id}
                  className={`border-b border-zinc-100 dark:border-zinc-900 ${
                    b.en_rupture
                      ? "bg-red-50/80 dark:bg-red-950/40"
                      : ""
                  }`}
                >
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {b.nom}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {b.categorie ?? "Sans catégorie"}
                    </p>
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {b.quantite_par_costume}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums font-medium">
                    {b.besoin_commande}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {b.reserve_autres}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">{b.stock_total}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{b.disponible}</td>
                  <td
                    className={`py-2.5 tabular-nums font-semibold ${
                      b.en_rupture
                        ? "text-red-700 dark:text-red-300"
                        : "text-zinc-400"
                    }`}
                  >
                    {b.manque > 0 ? `−${b.manque}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
