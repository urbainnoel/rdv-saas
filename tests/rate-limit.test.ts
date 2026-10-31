import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", async () => (await import("./helpers/db")).createTestDb());

import { db } from "@/db";
import { sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { cleanupRateLimits, clientIp, rateLimit } from "@/lib/rate-limit";
import { resetDb } from "./helpers/db";

beforeEach(() => resetDb(db));
afterEach(() => vi.restoreAllMocks());

/** Recule le début de fenêtre d'un compteur (simule le temps qui passe côté base). */
async function ageWindow(key: string, seconds: number) {
  await db.execute(sql`UPDATE rate_limits SET window_start = window_start - make_interval(secs => ${seconds}) WHERE key = ${key}`);
}

async function counter(key: string): Promise<number | undefined> {
  const res = await db.execute(sql`SELECT count FROM rate_limits WHERE key = ${key}`);
  return (res.rows[0] as { count: number } | undefined)?.count;
}

describe("rateLimit", () => {
  it("db.execute renvoie bien { rows } avec pglite (comme neon-http)", async () => {
    const res = await db.execute(sql`SELECT 1 AS one`);
    expect(Array.isArray(res.rows)).toBe(true);
    expect(res.rows[0]).toEqual({ one: 1 });
  });

  it("autorise jusqu'à la limite incluse puis refuse", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) results.push(await rateLimit("chat:ip:1.2.3.4", 3, 60));
    expect(results).toEqual([true, true, true, false, false]);
    expect(await counter("chat:ip:1.2.3.4")).toBe(5);
  });

  it("chaque clé a son propre compteur", async () => {
    expect(await rateLimit("a", 1, 60)).toBe(true);
    expect(await rateLimit("a", 1, 60)).toBe(false);
    expect(await rateLimit("b", 1, 60)).toBe(true);
  });

  it("la fenêtre expirée remet le compteur à 1", async () => {
    const key = "login:email:x@y.z";
    for (let i = 0; i < 4; i++) await rateLimit(key, 3, 60);
    expect(await rateLimit(key, 3, 60)).toBe(false);

    await ageWindow(key, 61);
    expect(await rateLimit(key, 3, 60)).toBe(true);
    expect(await counter(key)).toBe(1);
    expect(await rateLimit(key, 3, 60)).toBe(true);
    expect(await counter(key)).toBe(2);
  });

  it("tant que la fenêtre n'est pas finie, le compteur continue", async () => {
    const key = "k";
    await rateLimit(key, 2, 60);
    await rateLimit(key, 2, 60);
    await ageWindow(key, 59);
    expect(await rateLimit(key, 2, 60)).toBe(false);
    expect(await counter(key)).toBe(3);
  });

  it("en cas de panne de la base, laisse passer", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(db, "execute").mockRejectedValueOnce(new Error("panne"));
    expect(await rateLimit("k", 0, 60)).toBe(true);
    expect(console.error).toHaveBeenCalled();
  });

  it("cleanupRateLimits supprime les compteurs de plus de 2 jours seulement", async () => {
    await rateLimit("vieux", 10, 60);
    await rateLimit("recent", 10, 60);
    await ageWindow("vieux", 3 * 24 * 3600);
    await ageWindow("recent", 24 * 3600);

    await cleanupRateLimits();
    expect(await counter("vieux")).toBeUndefined();
    expect(await counter("recent")).toBe(1);
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) => ({ headers: new Headers(headers) }) as unknown as NextRequest;

  it("prend la première adresse de x-forwarded-for", () => {
    expect(clientIp(req({ "x-forwarded-for": "41.223.1.2, 10.0.0.1" }))).toBe("41.223.1.2");
    expect(clientIp(req({ "x-forwarded-for": "  41.223.1.2  " }))).toBe("41.223.1.2");
  });

  it("sinon x-real-ip, sinon « unknown »", () => {
    expect(clientIp(req({ "x-real-ip": "41.223.9.9" }))).toBe("41.223.9.9");
    expect(clientIp(req({}))).toBe("unknown");
  });
});
