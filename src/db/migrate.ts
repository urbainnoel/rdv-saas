// Exécute les migrations SQL (dossier ./drizzle) contre la base DATABASE_URL.
// Lancé automatiquement avant chaque build (voir le script "build" dans package.json),
// donc les tables sont toujours à jour sur Vercel sans étape manuelle.

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL absent — migration ignorée (OK en local sans base configurée).");
    return;
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Application des migrations…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations appliquées ✅");
}

main().catch((err) => {
  console.error("Échec des migrations :", err);
  process.exit(1);
});
