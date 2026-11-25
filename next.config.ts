import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Keep Cache Components off — it was producing opaque RSC digests on /pieces
     (Erreur — Pièces Réf. 520999525) under the published host. */
  /* Map .js → .ts so cursor/identity.ts can import ./identity.dev.js (apps-identity). */
  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"],
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
