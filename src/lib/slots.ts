// Calcule les créneaux disponibles pour un entrepreneur sur une date donnée,
// en tenant compte de : ses disponibilités récurrentes, les créneaux bloqués,
// et les rendez-vous déjà pris.

import { db, schema } from "@/db";
import { and, eq, gte, lt, ne } from "drizzle-orm";

export type Slot = {
  startAt: Date;
  endAt: Date;
};

function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Retourne les créneaux libres pour un entrepreneur, pour une journée donnée.
 * `date` doit être à minuit (00:00) dans le fuseau horaire pertinent.
 */
export async function getAvailableSlotsForDay(
  entrepreneurId: string,
  date: Date
): Promise<Slot[]> {
  const dayOfWeek = date.getDay();
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // 1. Récupérer les règles de disponibilité pour ce jour de la semaine
  const rules = await db
    .select()
    .from(schema.availabilities)
    .where(
      and(
        eq(schema.availabilities.entrepreneurId, entrepreneurId),
        eq(schema.availabilities.dayOfWeek, dayOfWeek)
      )
    );

  if (rules.length === 0) return [];

  // 2. Récupérer les créneaux bloqués qui chevauchent cette journée
  const blocked = await db
    .select()
    .from(schema.blockedSlots)
    .where(eq(schema.blockedSlots.entrepreneurId, entrepreneurId));

  const blockedForDay = blocked.filter((b) =>
    overlaps(new Date(b.startAt), new Date(b.endAt), dayStart, dayEnd)
  );

  // 3. Récupérer les RDV déjà pris (hors annulés) ce jour-là
  const existingAppointments = await db
    .select()
    .from(schema.appointments)
    .where(
      and(
        eq(schema.appointments.entrepreneurId, entrepreneurId),
        ne(schema.appointments.status, "CANCELLED")
      )
    );

  const appointmentsForDay = existingAppointments.filter((a) =>
    overlaps(new Date(a.startAt), new Date(a.endAt), dayStart, dayEnd)
  );

  // 4. Générer tous les créneaux théoriques à partir des règles, puis filtrer
  const slots: Slot[] = [];

  for (const rule of rules) {
    const ruleStart = combineDateAndTime(dayStart, rule.startTime);
    const ruleEnd = combineDateAndTime(dayStart, rule.endTime);
    const durationMs = rule.slotDurationMinutes * 60 * 1000;

    let cursor = new Date(ruleStart);
    while (cursor.getTime() + durationMs <= ruleEnd.getTime()) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor.getTime() + durationMs);

      const isBlocked = blockedForDay.some((b) =>
        overlaps(slotStart, slotEnd, new Date(b.startAt), new Date(b.endAt))
      );
      const isTaken = appointmentsForDay.some((a) =>
        overlaps(slotStart, slotEnd, new Date(a.startAt), new Date(a.endAt))
      );

      // On n'affiche pas les créneaux déjà passés (sécurité si "aujourd'hui")
      const isPast = slotStart.getTime() < Date.now();

      if (!isBlocked && !isTaken && !isPast) {
        slots.push({ startAt: slotStart, endAt: slotEnd });
      }

      cursor = new Date(cursor.getTime() + durationMs);
    }
  }

  return slots;
}

/**
 * Retourne les créneaux libres sur plusieurs jours (ex: les 14 prochains jours).
 */
export async function getAvailableSlotsForRange(
  entrepreneurId: string,
  fromDate: Date,
  numberOfDays: number
): Promise<Record<string, Slot[]>> {
  const result: Record<string, Slot[]> = {};

  for (let i = 0; i < numberOfDays; i++) {
    const day = new Date(fromDate);
    day.setDate(day.getDate() + i);
    day.setHours(0, 0, 0, 0);

    const slots = await getAvailableSlotsForDay(entrepreneurId, day);
    if (slots.length > 0) {
      const key = day.toISOString().split("T")[0];
      result[key] = slots;
    }
  }

  return result;
}
