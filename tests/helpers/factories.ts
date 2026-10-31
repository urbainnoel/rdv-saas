// Petites fabriques de données pour remplir la base de test sans répéter
// tous les champs obligatoires dans chaque test.

import type { TestDb } from "./db";
import * as schema from "@/db/schema";

let counter = 0;
const uid = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

export async function makeEntrepreneur(db: unknown, overrides: Partial<typeof schema.entrepreneurs.$inferInsert> = {}) {
  const n = uid();
  const [row] = await (db as TestDb)
    .insert(schema.entrepreneurs)
    .values({
      email: `pro-${n}@exemple.test`,
      businessName: `Cabinet ${n}`,
      slug: `cabinet-${n}`,
      timezone: "Africa/Conakry",
      ...overrides,
    })
    .returning();
  return row;
}

export async function makeClient(
  db: unknown,
  entrepreneurId: string,
  overrides: Partial<typeof schema.clients.$inferInsert> = {}
) {
  const [row] = await (db as TestDb)
    .insert(schema.clients)
    .values({ entrepreneurId, fullName: "Awa Diallo", ...overrides })
    .returning();
  return row;
}

/** Règle de disponibilité : `dayOfWeek` 0 = dimanche. */
export async function makeAvailability(
  db: unknown,
  entrepreneurId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  slotDurationMinutes = 60
) {
  const [row] = await (db as TestDb)
    .insert(schema.availabilities)
    .values({ entrepreneurId, dayOfWeek, startTime, endTime, slotDurationMinutes })
    .returning();
  return row;
}

export async function makeAppointment(
  db: unknown,
  input: {
    entrepreneurId: string;
    clientId: string;
    startAt: Date;
    endAt: Date;
    status?: string;
    source?: string | null;
    createdAt?: Date;
  }
) {
  const [row] = await (db as TestDb)
    .insert(schema.appointments)
    .values({ status: "CONFIRMED", ...input })
    .returning();
  return row;
}
