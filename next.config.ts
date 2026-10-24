import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Désactivé : toutes nos pages dépendent de données par requête
  // (session, entrepreneur connecté, créneaux en temps réel), donc rien
  // ici ne bénéficie du cache statique — et ça évite d'avoir à annoter
  // chaque page individuellement.
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
