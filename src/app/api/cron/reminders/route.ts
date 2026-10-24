// Tâche planifiée : envoie les rappels 24 h et 1 h avant chaque rendez-vous.
//
// Appelée toutes les 15 minutes par GitHub Actions (.github/workflows/reminders.yml),
// protégée par le secret CRON_SECRET. Peut être appelée aussi souvent qu'on
// veut : chaque rappel est « réservé » en base avant envoi, donc jamais
// envoyé deux fois, même si deux exécutions se chevauchent.

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, gt, inArray, isNull, lte } from "drizzle-orm";
import { sendReminder } from "@/lib/notifications";
import { cleanupRateLimits } from "@/lib/rate-limit";

const HOUR = 60 * 60 * 1000;
// Fenêtre du rappel « 1 h avant » : un peu plus large que l'intervalle de la
// tâche (15 min) pour ne jamais rater un rendez-vous entre deux passages.
const ONE_HOUR_WINDOW = 75 * 60 * 1000;
const MAX_SENDS_PER_RUN = 100;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(req: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ error: "CRON_SECRET non configuré." }, { status: 503 });
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * HOUR);

  const upcoming = await db
    .select({
      appointment: schema.appointments,
      client: schema.clients,
      entrepreneur: schema.entrepreneurs,
    })
    .from(schema.appointments)
    .innerJoin(schema.clients, eq(schema.appointments.clientId, schema.clients.id))
    .innerJoin(schema.entrepreneurs, eq(schema.appointments.entrepreneurId, schema.entrepreneurs.id))
    .where(
      and(
        inArray(schema.appointments.status, ["PENDING", "CONFIRMED"]),
        gt(schema.appointments.startAt, now),
        lte(schema.appointments.startAt, in24h)
      )
    );

  let sent24h = 0;
  let sent1h = 0;
  let skipped = 0;

  for (const { appointment, client, entrepreneur } of upcoming) {
    if (sent24h + sent1h >= MAX_SENDS_PER_RUN) break;

    const start = new Date(appointment.startAt).getTime();
    const remaining = start - now.getTime();
    const bookedAhead = start - new Date(appointment.createdAt).getTime();

    let type: "REMINDER_24H" | "REMINDER_1H" | null = null;
    if (!appointment.reminder1hSentAt && remaining <= ONE_HOUR_WINDOW) {
      type = "REMINDER_1H";
    } else if (
      !appointment.reminder24hSentAt &&
      remaining > 2 * HOUR &&
      // Pas de rappel « demain » pour un RDV pris la veille : la
      // confirmation vient d'arriver, un rappel en plus serait du bruit.
      bookedAhead >= 23 * HOUR
    ) {
      type = "REMINDER_24H";
    }
    if (!type) continue;

    // Réserver le rappel avant de l'envoyer (anti-doublon).
    const column =
      type === "REMINDER_1H" ? schema.appointments.reminder1hSentAt : schema.appointments.reminder24hSentAt;
    const claimed = await db
      .update(schema.appointments)
      .set(type === "REMINDER_1H" ? { reminder1hSentAt: now } : { reminder24hSentAt: now })
      .where(and(eq(schema.appointments.id, appointment.id), isNull(column)))
      .returning({ id: schema.appointments.id });
    if (claimed.length === 0) continue;

    // Respecter le modèle de l'entrepreneur (texte personnalisé, ou désactivé).
    const [template] = await db
      .select()
      .from(schema.messageTemplates)
      .where(
        and(
          eq(schema.messageTemplates.entrepreneurId, entrepreneur.id),
          eq(schema.messageTemplates.type, type)
        )
      )
      .limit(1);
    if (template && !template.enabled) {
      skipped++;
      continue;
    }

    try {
      await sendReminder({ entrepreneur, client, appointment, type, template: template?.content });
      if (type === "REMINDER_1H") sent1h++;
      else sent24h++;
    } catch (err) {
      console.error(`[cron/reminders] Échec du rappel ${type} pour le RDV ${appointment.id}:`, err);
    }
  }

  await cleanupRateLimits().catch((err) => console.error("[cron/reminders] Nettoyage des limites:", err));

  return NextResponse.json({ ok: true, checked: upcoming.length, sent24h, sent1h, skipped });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
