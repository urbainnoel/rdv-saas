// Limites d'utilisation (anti-abus) stockées dans Postgres.
//
// Pourquoi en base et pas en mémoire : sur Vercel chaque requête peut tomber
// sur une instance différente, un compteur en mémoire ne protégerait rien.
// Un seul aller-retour SQL atomique par vérification (INSERT ... ON CONFLICT).

import { db } from "@/db";
import { sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

/**
 * Incrémente le compteur `key` et indique si la requête est autorisée.
 * Fenêtre fixe : au-delà de `windowSeconds`, le compteur repart à 1.
 * En cas de panne de la base, on laisse passer (mieux vaut un service
 * disponible qu'un service bloqué par sa propre protection).
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      INSERT INTO rate_limits (key, count, window_start)
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
          THEN 1 ELSE rate_limits.count + 1 END,
        window_start = CASE
          WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
          THEN now() ELSE rate_limits.window_start END
      RETURNING count
    `);
    const count = Number((result.rows[0] as { count: number } | undefined)?.count ?? 0);
    return count <= limit;
  } catch (err) {
    console.error(`[rate-limit] Vérification impossible pour ${key}:`, err);
    return true;
  }
}

/** Adresse IP du visiteur (Vercel la place dans x-forwarded-for). */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Supprime les compteurs dont la fenêtre est terminée depuis longtemps. */
export async function cleanupRateLimits() {
  await db.execute(sql`DELETE FROM rate_limits WHERE window_start < now() - interval '2 days'`);
}
