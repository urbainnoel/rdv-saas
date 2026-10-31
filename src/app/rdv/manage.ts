// Logique du lien de gestion /rdv/<jeton> : le client annule ou reporte
// lui-même son rendez-vous, sans compte. Partagée entre la page et l'API
// publique (/api/public/manage/[token]).
//
// Sécurité : le jeton (32 octets aléatoires) est la seule clé d'accès. On ne
// renvoie jamais que les infos de CE rendez-vous (activité, service, horaire,
// prénom), jamais le contact du client ni quoi que ce soit d'un autre RDV.

import { db, schema } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { getAvailableSlotsForRange, isFreeSlot } from "@/lib/slots";
import { notifyClientCancelled, notifyClientRescheduled } from "@/lib/notifications";

/** Délai minimal avant le RDV pour annuler ou reporter en ligne. */
export const MANAGE_CUTOFF_MS = 2 * 60 * 60 * 1000;
/** Fenêtre de report proposée au client. */
export const RESCHEDULE_DAYS = 21;

// base64url de 32 octets = 43 caractères ; on accepte une marge sans jamais
// interroger la base avec une valeur farfelue.
const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;

export type ManageBlockReason = "cancelled" | "past" | "too_late";

export function isWellFormedToken(token: string): boolean {
  return TOKEN_RE.test(token);
}

/** Pourquoi ce RDV ne peut plus être modifié en ligne (null = modifiable). */
export function manageBlockReason(
  appointment: { status: string; startAt: Date },
  now: number = Date.now()
): ManageBlockReason | null {
  if (appointment.status === "CANCELLED") return "cancelled";
  const start = new Date(appointment.startAt).getTime();
  if (start <= now || appointment.status === "COMPLETED" || appointment.status === "NO_SHOW") return "past";
  if (start - now < MANAGE_CUTOFF_MS) return "too_late";
  return null;
}

export async function findManagedAppointment(token: string) {
  if (!isWellFormedToken(token)) return null;
  const [row] = await db
    .select({
      appointment: schema.appointments,
      entrepreneur: schema.entrepreneurs,
      client: schema.clients,
      serviceName: schema.services.name,
    })
    .from(schema.appointments)
    .innerJoin(schema.entrepreneurs, eq(schema.entrepreneurs.id, schema.appointments.entrepreneurId))
    .innerJoin(schema.clients, eq(schema.clients.id, schema.appointments.clientId))
    .leftJoin(schema.services, eq(schema.services.id, schema.appointments.serviceId))
    .where(eq(schema.appointments.manageToken, token))
    .limit(1);
  return row ?? null;
}

export type ManageResult =
  | { ok: true; startAt: Date; endAt: Date }
  | { ok: false; status: number; error: string; reason?: ManageBlockReason };

function blockedResult(reason: ManageBlockReason): ManageResult {
  const error =
    reason === "cancelled"
      ? "Ce rendez-vous est déjà annulé."
      : reason === "past"
        ? "Ce rendez-vous est déjà passé."
        : "Votre rendez-vous commence dans moins de 2 heures : contactez directement le professionnel.";
  return { ok: false, status: 409, error, reason };
}

const NOT_FOUND: ManageResult = { ok: false, status: 404, error: "Lien invalide ou expiré." };

// Statuts encore modifiables : sert de garde dans les UPDATE, pour qu'une
// annulation faite entre-temps par l'entrepreneur ne soit jamais écrasée.
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"];

export async function cancelByToken(token: string): Promise<ManageResult> {
  const found = await findManagedAppointment(token);
  if (!found) return NOT_FOUND;
  const reason = manageBlockReason(found.appointment);
  if (reason) return blockedResult(reason);

  const [updated] = await db
    .update(schema.appointments)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(
      and(
        eq(schema.appointments.id, found.appointment.id),
        inArray(schema.appointments.status, ACTIVE_STATUSES)
      )
    )
    .returning();
  if (!updated) return blockedResult("cancelled");

  notifyClientCancelled({ entrepreneur: found.entrepreneur, client: found.client, appointment: updated }).catch(
    (err) => console.error("Erreur notification annulation client:", err)
  );
  return { ok: true, startAt: updated.startAt, endAt: updated.endAt };
}

export async function rescheduleByToken(token: string, startAt: Date, endAt: Date): Promise<ManageResult> {
  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime()) || startAt >= endAt) {
    return { ok: false, status: 400, error: "Créneau invalide." };
  }
  const found = await findManagedAppointment(token);
  if (!found) return NOT_FOUND;
  const reason = manageBlockReason(found.appointment);
  if (reason) return blockedResult(reason);

  const { appointment, entrepreneur, client } = found;
  if (startAt.getTime() === appointment.startAt.getTime() && endAt.getTime() === appointment.endAt.getTime()) {
    return { ok: false, status: 400, error: "C'est déjà l'horaire de votre rendez-vous." };
  }
  // Revalidation serveur : le créneau doit faire partie des disponibilités
  // ET être libre au moment de l'écriture (il a pu être pris entre-temps).
  if (!(await isFreeSlot(entrepreneur, startAt, endAt))) {
    return {
      ok: false,
      status: 409,
      error: "Ce créneau n'est plus disponible. Merci d'en choisir un autre.",
    };
  }

  const [updated] = await db
    .update(schema.appointments)
    .set({
      startAt,
      endAt,
      // Les rappels repartent de zéro pour le nouvel horaire.
      reminderSentAt: null,
      reminder24hSentAt: null,
      reminder1hSentAt: null,
      confirmedByClientAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.appointments.id, appointment.id),
        inArray(schema.appointments.status, ACTIVE_STATUSES),
        // Garde : si l'horaire a changé entre la lecture et l'écriture
        // (double clic, entrepreneur), on n'écrase rien.
        eq(schema.appointments.startAt, appointment.startAt)
      )
    )
    .returning();
  if (!updated) {
    return { ok: false, status: 409, error: "Votre rendez-vous a changé entre-temps. Rechargez la page." };
  }

  notifyClientRescheduled({ entrepreneur, client, appointment: updated, previousStart: appointment.startAt }).catch(
    (err) => console.error("Erreur notification report client:", err)
  );
  return { ok: true, startAt: updated.startAt, endAt: updated.endAt };
}

/** Créneaux proposés pour un report (vide si le RDV n'est plus modifiable). */
export async function rescheduleOptions(token: string) {
  const found = await findManagedAppointment(token);
  if (!found) return null;
  if (manageBlockReason(found.appointment)) return { slotsByDay: {} };
  const byDay = await getAvailableSlotsForRange(found.entrepreneur, RESCHEDULE_DAYS);
  const slotsByDay: Record<string, { startAt: string; endAt: string }[]> = {};
  for (const day of Object.keys(byDay).sort()) {
    slotsByDay[day] = byDay[day].map((s) => ({ startAt: s.startAt.toISOString(), endAt: s.endAt.toISOString() }));
  }
  return { slotsByDay };
}
