"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <h1 style={{ fontSize: 20 }}>Erreur serveur</h1>
        <p style={{ color: "#b91c1c" }}>
          Impossible d’afficher l’application pour le moment.
        </p>
        {error?.digest ? (
          <p style={{ color: "#71717a", fontSize: 12 }}>Réf. {error.digest}</p>
        ) : null}
        <button type="button" onClick={() => reset()} style={{ marginTop: 12 }}>
          Réessayer
        </button>
      </body>
    </html>
  );
}
