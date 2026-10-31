// Vérifie que la route POST /api/dashboard/availability utilise bien la
// validation extraite, avec les mêmes codes et messages qu'avant.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", async () => {
  const testDb = await (await import("./helpers/db")).createTestDb();
  // pglite n'a pas de db.batch (propre à neon-http) : on l'imite en
  // exécutant les requêtes l'une après l'autre.
  const db = Object.assign(testDb.db, {
    batch: async (queries: PromiseLike<unknown>[]) => {
      const results: unknown[] = [];
      for (const q of queries) results.push(await q);
      return results;
    },
  });
  return { ...testDb, db };
});

const currentEntrepreneur = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentEntrepreneur: () => currentEntrepreneur() }));

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/dashboard/availability/route";
import { resetDb } from "./helpers/db";
import { makeAvailability, makeEntrepreneur } from "./helpers/factories";

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/dashboard/availability", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "content-type": "application/json" },
    })
  );

beforeEach(async () => {
  await resetDb(db);
  currentEntrepreneur.mockReset();
});

describe("POST /api/dashboard/availability", () => {
  it("401 sans session", async () => {
    currentEntrepreneur.mockResolvedValue(null);
    const res = await post({ daysOfWeek: [1], startTime: "09:00", endTime: "17:00" });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Non authentifié." });
  });

  it("400 avec le message de la validation", async () => {
    currentEntrepreneur.mockResolvedValue(await makeEntrepreneur(db));
    const res = await post({ daysOfWeek: [1], startTime: "17:00", endTime: "09:00" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "L'heure de fin doit être après l'heure de début." });
  });

  it("400 pour un corps qui n'est pas du JSON", async () => {
    currentEntrepreneur.mockResolvedValue(await makeEntrepreneur(db));
    const res = await post("pas du json");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Choisis au moins un jour." });
  });

  it("201 : remplace les horaires des jours choisis, garde les autres jours et les autres comptes", async () => {
    const pro = await makeEntrepreneur(db);
    const other = await makeEntrepreneur(db);
    currentEntrepreneur.mockResolvedValue(pro);
    await makeAvailability(db, pro.id, 1, "08:00", "10:00", 30); // lundi : sera remplacé
    await makeAvailability(db, pro.id, 6, "10:00", "12:00", 30); // samedi : conservé
    await makeAvailability(db, other.id, 1, "08:00", "10:00", 30); // autre compte : intact

    const res = await post({
      daysOfWeek: [1, 2, 2],
      startTime: "09:00",
      endTime: "17:00",
      slotDurationMinutes: 60,
      pause: { start: "12:00", end: "13:00" },
    });
    expect(res.status).toBe(201);
    const { rules } = await res.json();
    expect(rules).toHaveLength(4);

    const mine = await db.select().from(schema.availabilities).where(eq(schema.availabilities.entrepreneurId, pro.id));
    const summary = mine
      .map((r) => `${r.dayOfWeek} ${r.startTime}-${r.endTime} ${r.slotDurationMinutes}`)
      .sort();
    expect(summary).toEqual([
      "1 09:00-12:00 60",
      "1 13:00-17:00 60",
      "2 09:00-12:00 60",
      "2 13:00-17:00 60",
      "6 10:00-12:00 30",
    ]);
    const others = await db.select().from(schema.availabilities).where(eq(schema.availabilities.entrepreneurId, other.id));
    expect(others).toHaveLength(1);
  });
});
