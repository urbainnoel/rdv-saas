import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Fuseau du serveur = UTC, comme sur Vercel. Les tests de fuseau vérifient
    // en plus que le résultat ne dépend pas de ce réglage.
    env: { TZ: "UTC" },
    // Démarrer pglite et appliquer les migrations prend une à deux secondes.
    hookTimeout: 30_000,
    testTimeout: 15_000,
  },
});
