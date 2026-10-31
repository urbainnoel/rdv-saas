// Absences / indisponibilités de l'entrepreneur (table blocked_slots).
// Les créneaux qui tombent dedans disparaissent de la réservation (slots.ts).
// Les RDV déjà pris pendant la période ne sont PAS annulés : on les renvoie
// pour que l'entrepreneur décide lui-même de les reporter.

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, asc, eq, gt, lt, ne } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { addDaysToKey, formatDateFr, formatTimeFr, safeTimeZone, zonedTimeToUtc } from "@/lib/timezone";
import { isValidDateKey } from "@/app/dashboard/agenda/week";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_DAYS = 366;

/**
 * Corps : { startDate: "2026-11-03", endDate: "2026-11-05", allDay: true }
 *      ou { startDate, endDate, allDay: false, startTime: "14:00", endTime: "12:00" }
 * Plage horaire = une seule période continue, du jour de début à l'heure de
 * début jusqu'au jour de fin à l'heure de fin (heures de l'entrepreneur).
 */
export async function POST(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const startDate = String(body?.startDate ?? "");
  const endDate = String(body?.endDate ?? "") || startDate;
  const allDay = body?.allDay !== false;
  const startTime = String(body?.startTime ?? "");
  const endTime = String(body?.endTime ?? "");
  const reason = String(body?.reason ?? "").trim().slice(0, 200);

  if (!isValidDateKey(startDate) || !isValidDateKey(endDate)) {
    return NextResponse.json({ error: "Dates invalides." }, { status: 400 });
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: "La date de fin doit être le même jour ou après la date de début." }, { status: 400 });
  }
  if (!allDay && (!TIME_RE.test(startTime) || !TIME_RE.test(endTime))) {
    return NextResponse.json({ error: "Heures invalides." }, { status: 400 });
  }

  const tz = safeTimeZone(entrepreneur.timezone);
  const startAt = zonedTimeToUtc(startDate, allDay ? "00:00" : startTime, tz);
  const endAt = allDay
    ? zonedTimeToUtc(addDaysToKey(endDate, 1), "00:00", tz)
    : zonedTimeToUtc(endDate, endTime, tz);

  if (endAt <= startAt) {
    return NextResponse.json({ error: "La fin de l'absence doit être après son début." }, { status: 400 });
  }
  if (endAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Cette période est déjà passée." }, { status: 400 });
  }
  if (endAt.getTime() - startAt.getTime() > MAX_DAYS * 24 * 3600 * 1000) {
    return NextResponse.json({ error: "Une absence ne peut pas dépasser un an." }, { status: 400 });
  }

  const [absence] = await db
    .insert(schema.blockedSlots)
    .values({ entrepreneurId: entrepreneur.id, startAt, endAt, reason: reason || null })
    .returning();

  // RDV maintenus pendant l'absence, à reporter à la main depuis l'agenda.
  const kept = await db
    .select({
      id: schema.appointments.id,
      startAt: schema.appointments.startAt,
      clientName: schema.clients.fullName,
    })
    .from(schema.appointments)
    .innerJoin(schema.clients, eq(schema.appointments.clientId, schema.clients.id))
    .where(
      and(
        eq(schema.appointments.entrepreneurId, entrepreneur.id),
        ne(schema.appointments.status, "CANCELLED"),
        lt(schema.appointments.startAt, endAt),
        gt(schema.appointments.endAt, startAt)
      )
    )
    .orderBy(asc(schema.appointments.startAt));

  return NextResponse.json(
    {
      absence: { id: absence.id },
      conflicts: kept.map((a) => {
        const s = new Date(a.startAt);
        return { id: a.id, clientName: a.clientName, label: `${formatDateFr(s, tz)} à ${formatTimeFr(s, tz)}` };
      }),
    },
    { status: 201 }
  );
}
