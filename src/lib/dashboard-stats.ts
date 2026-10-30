// Chiffres de l'écran d'accueil du tableau de bord. Une poignée de requêtes
// légères, lancées en parallèle, calculées dans le fuseau de l'entrepreneur.

import { db, schema } from "@/db";
import { and, asc, count, eq, gt, gte, lt, ne } from "drizzle-orm";
import { addDaysToKey, localDateKey, safeTimeZone, zonedTimeToUtc } from "./timezone";

type Entrepreneur = typeof schema.entrepreneurs.$inferSelect;

export type DashboardStats = {
  /** RDV (non annulés) qui commencent aujourd'hui, heure locale. */
  todayCount: number;
  /** Prochain RDV à venir (aujourd'hui ou plus tard), s'il y en a un. */
  next: { startAt: Date; clientName: string; isToday: boolean } | null;
  /** Prospects encore « à recontacter ». */
  leadsToContact: number;
  /** Réservations reçues ces 7 derniers jours, et combien via l'assistant. */
  bookings7d: number;
  bookings7dByAssistant: number;
  /** Mise en route : l'entrepreneur a-t-il défini ses horaires / informé son assistant ? */
  hasAvailability: boolean;
  hasKnowledge: boolean;
};

export async function getDashboardStats(entrepreneur: Entrepreneur, now = new Date()): Promise<DashboardStats> {
  const tz = safeTimeZone(entrepreneur.timezone);
  const todayKey = localDateKey(now, tz);
  const dayStart = zonedTimeToUtc(todayKey, "00:00", tz);
  const dayEnd = zonedTimeToUtc(addDaysToKey(todayKey, 1), "00:00", tz);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const mine = eq(schema.appointments.entrepreneurId, entrepreneur.id);
  const active = ne(schema.appointments.status, "CANCELLED");

  const [[today], [nextRow], [leads], [week], [weekAssistant], [avail], [kb]] = await Promise.all([
    db
      .select({ n: count() })
      .from(schema.appointments)
      .where(and(mine, active, gte(schema.appointments.startAt, dayStart), lt(schema.appointments.startAt, dayEnd))),
    db
      .select({ startAt: schema.appointments.startAt, clientName: schema.clients.fullName })
      .from(schema.appointments)
      .innerJoin(schema.clients, eq(schema.appointments.clientId, schema.clients.id))
      .where(and(mine, active, gt(schema.appointments.startAt, now)))
      .orderBy(asc(schema.appointments.startAt))
      .limit(1),
    db
      .select({ n: count() })
      .from(schema.leads)
      .where(and(eq(schema.leads.entrepreneurId, entrepreneur.id), eq(schema.leads.status, "NEW"))),
    db
      .select({ n: count() })
      .from(schema.appointments)
      .where(and(mine, gte(schema.appointments.createdAt, weekAgo))),
    db
      .select({ n: count() })
      .from(schema.appointments)
      .where(and(mine, gte(schema.appointments.createdAt, weekAgo), eq(schema.appointments.source, "assistant"))),
    db
      .select({ n: count() })
      .from(schema.availabilities)
      .where(eq(schema.availabilities.entrepreneurId, entrepreneur.id)),
    db
      .select({ n: count() })
      .from(schema.knowledgeBaseEntries)
      .where(eq(schema.knowledgeBaseEntries.entrepreneurId, entrepreneur.id)),
  ]);

  const next = nextRow
    ? {
        startAt: new Date(nextRow.startAt),
        clientName: nextRow.clientName,
        isToday: new Date(nextRow.startAt) < dayEnd,
      }
    : null;

  return {
    todayCount: Number(today?.n ?? 0),
    next,
    leadsToContact: Number(leads?.n ?? 0),
    bookings7d: Number(week?.n ?? 0),
    bookings7dByAssistant: Number(weekAssistant?.n ?? 0),
    hasAvailability: Number(avail?.n ?? 0) > 0,
    hasKnowledge: Number(kb?.n ?? 0) > 0,
  };
}
