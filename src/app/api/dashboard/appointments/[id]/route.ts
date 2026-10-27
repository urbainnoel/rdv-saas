// Annuler ou reporter un rendez-vous depuis l'agenda de l'entrepreneur.

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, ne } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { isFreeSlot } from "@/lib/slots";
import { sendCancellationNotice, sendRescheduleNotice } from "@/lib/notifications";

type Body =
  | { action: "cancel" }
  | { action: "reschedule"; startAt: string; endAt: string };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as Body | null;

  const [row] = await db
    .select({ appointment: schema.appointments, client: schema.clients })
    .from(schema.appointments)
    .innerJoin(schema.clients, eq(schema.appointments.clientId, schema.clients.id))
    .where(
      and(
        eq(schema.appointments.id, id),
        eq(schema.appointments.entrepreneurId, entrepreneur.id),
        ne(schema.appointments.status, "CANCELLED")
      )
    )
    .limit(1);

  if (!row) return NextResponse.json({ error: "Rendez-vous introuvable ou déjà annulé." }, { status: 404 });
  const { appointment, client } = row;

  if (body?.action === "cancel") {
    const [updated] = await db
      .update(schema.appointments)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(eq(schema.appointments.id, appointment.id))
      .returning();
    sendCancellationNotice({ entrepreneur, client, appointment: updated }).catch((err) =>
      console.error("Erreur notification annulation:", err)
    );
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "reschedule") {
    const startAt = new Date(body.startAt);
    const endAt = new Date(body.endAt);
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime()) || startAt >= endAt) {
      return NextResponse.json({ error: "Créneau invalide." }, { status: 400 });
    }

    // Même règle qu'à la réservation : uniquement un vrai créneau libre.
    if (!(await isFreeSlot(entrepreneur, startAt, endAt))) {
      return NextResponse.json(
        { error: "Ce créneau n'est plus libre. Choisis-en un autre." },
        { status: 409 }
      );
    }

    const previousStart = new Date(appointment.startAt);
    const [updated] = await db
      .update(schema.appointments)
      .set({
        startAt,
        endAt,
        updatedAt: new Date(),
        // Nouveaux horaires : les rappels doivent repartir de zéro.
        reminder24hSentAt: null,
        reminder1hSentAt: null,
      })
      .where(eq(schema.appointments.id, appointment.id))
      .returning();
    sendRescheduleNotice({ entrepreneur, client, appointment: updated, previousStart }).catch((err) =>
      console.error("Erreur notification report:", err)
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
