import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Keep Cache Components off — it was producing opaque RSC digests on /pieces
     (Erreur — Pièces Réf. 520999525) under the published host. */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
