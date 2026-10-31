// Base Postgres en mémoire (pglite) pour les tests : mêmes migrations que la
// production, aucune connexion réseau. Chaque fichier de test qui remplace
// `@/db` obtient sa propre base, isolée des autres fichiers.
//
// Utilisation dans un fichier de test :
//   vi.mock("@/db", async () => (await import("./helpers/db")).createTestDb());
//   import { db, schema } from "@/db";
//   beforeEach(() => resetDb(db));

import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import * as schema from "@/db/schema";

const DRIZZLE_DIR = path.resolve(__dirname, "../../drizzle");

/** Fichiers de migration dans l'ordre du journal de drizzle-kit (comme en prod). */
function migrationFiles(): string[] {
  const journal = JSON.parse(readFileSync(path.join(DRIZZLE_DIR, "meta/_journal.json"), "utf8")) as {
    entries: { idx: number; tag: string }[];
  };
  return [...journal.entries].sort((a, b) => a.idx - b.idx).map((e) => path.join(DRIZZLE_DIR, `${e.tag}.sql`));
}

export async function createTestDb() {
  const client = new PGlite();
  for (const file of migrationFiles()) {
    const statements = readFileSync(file, "utf8")
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await client.exec(statement);
    }
  }
  const db = drizzle(client, { schema });
  return { db, schema, client };
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>["db"];

/** Vide toutes les tables entre deux tests (plus rapide que recréer la base). */
export async function resetDb(db: unknown) {
  await (db as TestDb).execute(sql`
    TRUNCATE entrepreneurs, availabilities, blocked_slots, clients, services,
      appointments, message_templates, knowledge_base_entries, rate_limits,
      leads, unanswered_questions
    RESTART IDENTITY CASCADE
  `);
}
