// Ajout manuel d'un rendez-vous par l'entrepreneur (client au téléphone ou sur
// place). Contrairement à la réservation publique, il peut placer le RDV hors
// de ses horaires : c'est lui qui décide. Restent interdits : le passé et le
// chevauchement avec un RDV non annulé.

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, gt, lt, ne } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { createAppointment } from "@/lib/booking";
import { formatDateFr, formatTimeFr, safeTimeZone, zonedTimeToUtc } from "@/lib/timezone";
import { isValidDateKey } from "@/app/dashboard/agenda/week";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const fullName = String(body?.fullName ?? "").trim().slice(0, 120);
  const phone = String(body?.phone ?? "").trim().slice(0, 40);
  const email = String(body?.email ?? "").trim().slice(0, 200);
  const serviceId = body?.serviceId ? String(body.serviceId) : null;
  const date = String(body?.date ?? "");
  const time = String(body?.time ?? "");
  const duration = Number(body?.durationMinutes);
  const notes = String(body?.notes ?? "").trim().slice(0, 1000);

  if (!fullName) return NextResponse.json({ error: "Indique le nom du client." }, { status: 400 });
  if (!phone && !email) {
    return NextResponse.json({ error: "Indique au moins un téléphone ou un email." }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "L'adresse email n'est pas valide." }, { status: 400 });
  }
  if (!isValidDateKey(date) || !TIME_RE.test(time)) {
    return NextResponse.json({ error: "Date ou heure invalide." }, { status: 400 });
  }
  if (!Number.isInteger(duration) || duration < 5 || duration > 720) {
    return NextResponse.json({ error: "Durée invalide (entre 5 min et 12 h)." }, { status: 400 });
  }

  if (serviceId) {
    const [service] = await db
      .select({ id: schema.services.id })
      .from(schema.services)
      .where(
        and(
          eq(schema.services.id, serviceId),
          eq(schema.services.entrepreneurId, entrepreneur.id),
          eq(schema.services.archived, false)
        )
      )
      .limit(1);
    if (!service) return NextResponse.json({ error: "Ce service n'existe plus." }, { status: 400 });
  }

  // L'heure saisie est celle de l'entrepreneur, pas celle du serveur.
  const tz = safeTimeZone(entrepreneur.timezone);
  const startAt = zonedTimeToUtc(date, time, tz);
  const endAt = new Date(startAt.getTime() + duration * 60_000);

  if (startAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Cette heure est déjà passée." }, { status: 400 });
  }

  // Message précis en cas de chevauchement (createAppointment revérifie ensuite).
  const [conflict] = await db
    .select({
      startAt: schema.appointments.startAt,
      endAt: schema.appointments.endAt,
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
    .limit(1);
  if (conflict) {
    const s = new Date(conflict.startAt);
    return NextResponse.json(
      {
        error: `Ce créneau chevauche le rendez-vous de ${conflict.clientName}, ${formatDateFr(s, tz)} de ${formatTimeFr(s, tz)} à ${formatTimeFr(new Date(conflict.endAt), tz)}.`,
      },
      { status: 409 }
    );
  }

  const result = await createAppointment({
    entrepreneur,
    startAt,
    endAt,
    client: { fullName, phone: phone || null, email: email || null },
    serviceId,
    notes: notes || null,
    source: "manual",
    skipAvailabilityCheck: true,
  });

  if (!result.ok) {
    const error = result.status === 409 ? "Ce créneau chevauche un autre rendez-vous." : result.error;
    return NextResponse.json({ error }, { status: result.status });
  }

  return NextResponse.json(
    {
      appointment: { id: result.appointment.id },
      label: `${formatDateFr(startAt, tz)} à ${formatTimeFr(startAt, tz)}`,
    },
    { status: 201 }
  );
}
