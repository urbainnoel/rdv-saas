// Logique de création d'un rendez-vous, partagée entre le formulaire de
// réservation classique (/api/book) et l'assistant conversationnel
// (/api/chat), qui peut désormais réserver directement dans la discussion.

import { db, schema } from "@/db";
import { and, eq, ne } from "drizzle-orm";
import { sendAppointmentConfirmation } from "@/lib/notifications";

type Entrepreneur = typeof schema.entrepreneurs.$inferSelect;

export type CreateAppointmentInput = {
  entrepreneur: Entrepreneur;
  startAt: Date;
  endAt: Date;
  client: { fullName: string; email?: string | null; phone?: string | null };
  serviceId?: string | null;
  notes?: string | null;
};

export type CreateAppointmentResult =
  | { ok: true; appointment: typeof schema.appointments.$inferSelect }
  | { ok: false; status: number; error: string };

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export async function createAppointment({
  entrepreneur,
  startAt,
  endAt,
  client,
  serviceId,
  notes,
}: CreateAppointmentInput): Promise<CreateAppointmentResult> {
  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime()) || startAt >= endAt) {
    return { ok: false, status: 400, error: "Créneau invalide." };
  }
  if (startAt.getTime() < Date.now()) {
    return { ok: false, status: 400, error: "Ce créneau est déjà passé." };
  }
  if (!client.email && !client.phone) {
    return { ok: false, status: 400, error: "Il faut au moins un email ou un numéro de téléphone." };
  }

  let validServiceId: string | null = null;
  if (serviceId) {
    const [service] = await db
      .select()
      .from(schema.services)
      .where(and(eq(schema.services.id, serviceId), eq(schema.services.entrepreneurId, entrepreneur.id)))
      .limit(1);
    if (service) validServiceId = service.id;
  }

  // Vérification anti-double-réservation (re-check côté serveur au moment de l'écriture)
  const existing = await db
    .select()
    .from(schema.appointments)
    .where(
      and(
        eq(schema.appointments.entrepreneurId, entrepreneur.id),
        ne(schema.appointments.status, "CANCELLED")
      )
    );

  const conflict = existing.some((a) =>
    overlaps(startAt, endAt, new Date(a.startAt), new Date(a.endAt))
  );

  if (conflict) {
    return {
      ok: false,
      status: 409,
      error: "Ce créneau vient d'être réservé par quelqu'un d'autre. Merci d'en choisir un autre.",
    };
  }

  // Trouver ou créer le client
  let clientRecord = null;
  if (client.phone) {
    const [found] = await db
      .select()
      .from(schema.clients)
      .where(
        and(
          eq(schema.clients.entrepreneurId, entrepreneur.id),
          eq(schema.clients.phone, client.phone)
        )
      )
      .limit(1);
    clientRecord = found ?? null;
  }

  if (!clientRecord) {
    const [created] = await db
      .insert(schema.clients)
      .values({
        entrepreneurId: entrepreneur.id,
        fullName: client.fullName,
        email: client.email ?? null,
        phone: client.phone ?? null,
      })
      .returning();
    clientRecord = created;
  }

  const [appointment] = await db
    .insert(schema.appointments)
    .values({
      entrepreneurId: entrepreneur.id,
      clientId: clientRecord.id,
      serviceId: validServiceId,
      startAt,
      endAt,
      status: "CONFIRMED",
      notes: notes ?? null,
    })
    .returning();

  sendAppointmentConfirmation({ entrepreneur, client: clientRecord, appointment }).catch((err) =>
    console.error("Erreur envoi confirmation:", err)
  );

  return { ok: true, appointment };
}
