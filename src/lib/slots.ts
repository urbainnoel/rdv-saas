// Calcule les créneaux disponibles d'un entrepreneur, en tenant compte de :
// ses disponibilités récurrentes, les créneaux bloqués et les RDV déjà pris.
//
// Tout est interprété dans le fuseau horaire de l'entrepreneur : « lundi
// 9:00–17:00 » veut dire 9 h–17 h chez lui, quel que soit le fuseau du
// serveur (UTC sur Vercel) ou du visiteur.

import { db, schema } from "@/db";
import { and, eq, gt, lt, ne } from "drizzle-orm";
import {
  addDaysToKey,
  dayOfWeekOfKey,
  localDateKey,
  safeTimeZone,
  zonedTimeToUtc,
} from "./timezone";

export type Slot = {
  startAt: Date;
  endAt: Date;
};

type EntrepreneurRef = { id: string; timezone: string | null };

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Créneaux libres sur `numberOfDays` jours locaux à partir de `fromKey`
 * (AAAA-MM-JJ dans le fuseau de l'entrepreneur ; par défaut, aujourd'hui).
 * Trois requêtes au total, quel que soit le nombre de jours.
 */
export async function getAvailableSlotsForRange(
  entrepreneur: EntrepreneurRef,
  numberOfDays: number,
  fromKey?: string
): Promise<Record<string, Slot[]>> {
  const tz = safeTimeZone(entrepreneur.timezone);
  const firstKey = fromKey ?? localDateKey(new Date(), tz);
  const rangeStart = zonedTimeToUtc(firstKey, "00:00", tz);
  const rangeEnd = zonedTimeToUtc(addDaysToKey(firstKey, numberOfDays), "00:00", tz);

  const [rules, blocked, appointments] = await Promise.all([
    db
      .select()
      .from(schema.availabilities)
      .where(eq(schema.availabilities.entrepreneurId, entrepreneur.id)),
    db
      .select()
      .from(schema.blockedSlots)
      .where(
        and(
          eq(schema.blockedSlots.entrepreneurId, entrepreneur.id),
          lt(schema.blockedSlots.startAt, rangeEnd),
          gt(schema.blockedSlots.endAt, rangeStart)
        )
      ),
    db
      .select({ startAt: schema.appointments.startAt, endAt: schema.appointments.endAt })
      .from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.entrepreneurId, entrepreneur.id),
          ne(schema.appointments.status, "CANCELLED"),
          lt(schema.appointments.startAt, rangeEnd),
          gt(schema.appointments.endAt, rangeStart)
        )
      ),
  ]);

  const now = Date.now();
  const result: Record<string, Slot[]> = {};

  for (let i = 0; i < numberOfDays; i++) {
    const key = addDaysToKey(firstKey, i);
    const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeekOfKey(key));
    const slots: Slot[] = [];

    for (const rule of dayRules) {
      const ruleStart = zonedTimeToUtc(key, rule.startTime, tz);
      const ruleEnd = zonedTimeToUtc(key, rule.endTime, tz);
      const durationMs = rule.slotDurationMinutes * 60 * 1000;
      if (durationMs <= 0) continue;

      for (let t = ruleStart.getTime(); t + durationMs <= ruleEnd.getTime(); t += durationMs) {
        const slotStart = new Date(t);
        const slotEnd = new Date(t + durationMs);
        if (t < now) continue; // déjà passé
        if (blocked.some((b) => overlaps(slotStart, slotEnd, new Date(b.startAt), new Date(b.endAt)))) continue;
        if (appointments.some((a) => overlaps(slotStart, slotEnd, new Date(a.startAt), new Date(a.endAt)))) continue;
        slots.push({ startAt: slotStart, endAt: slotEnd });
      }
    }

    if (slots.length > 0) {
      slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
      result[key] = slots;
    }
  }

  return result;
}

/**
 * Le créneau [startAt, endAt] est-il exactement un créneau libre proposé ?
 * Utilisé pour valider une réservation ou un report côté serveur.
 */
export async function isFreeSlot(entrepreneur: EntrepreneurRef, startAt: Date, endAt: Date): Promise<boolean> {
  const tz = safeTimeZone(entrepreneur.timezone);
  const key = localDateKey(startAt, tz);
  const byDay = await getAvailableSlotsForRange(entrepreneur, 1, key);
  return (byDay[key] ?? []).some(
    (s) => s.startAt.getTime() === startAt.getTime() && s.endAt.getTime() === endAt.getTime()
  );
}
