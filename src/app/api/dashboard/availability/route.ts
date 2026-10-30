import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";

export async function GET() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const rules = await db
    .select()
    .from(schema.availabilities)
    .where(eq(schema.availabilities.entrepreneurId, entrepreneur.id));

  return NextResponse.json({ rules });
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/**
 * Définit des horaires pour un ou plusieurs jours d'un coup.
 * Corps : { daysOfWeek: number[] (0 = dimanche), startTime: "09:00",
 *           endTime: "17:00", slotDurationMinutes: 60,
 *           pause?: { start: "12:30", end: "14:00" } }
 * Pour les jours choisis, ces horaires REMPLACENT ceux déjà définis (sinon
 * on créerait des créneaux en double). Ancien format { dayOfWeek } accepté.
 */
export async function POST(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const rawDays: unknown = body?.daysOfWeek ?? (typeof body?.dayOfWeek === "number" ? [body.dayOfWeek] : null);
  const startTime = String(body?.startTime ?? "");
  const endTime = String(body?.endTime ?? "");
  const duration = Number(body?.slotDurationMinutes ?? 30);
  const pause = body?.pause as { start?: string; end?: string } | undefined | null;

  const days = Array.isArray(rawDays)
    ? [...new Set(rawDays)].filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];
  if (days.length === 0) {
    return NextResponse.json({ error: "Choisis au moins un jour." }, { status: 400 });
  }
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    return NextResponse.json({ error: "Horaires invalides." }, { status: 400 });
  }
  if (toMinutes(startTime) >= toMinutes(endTime)) {
    return NextResponse.json({ error: "L'heure de fin doit être après l'heure de début." }, { status: 400 });
  }
  if (!Number.isInteger(duration) || duration < 10 || duration > 480) {
    return NextResponse.json({ error: "Durée de séance invalide (entre 10 min et 8 h)." }, { status: 400 });
  }

  // Plages de travail : une seule, ou deux autour de la pause.
  let ranges: [string, string][] = [[startTime, endTime]];
  if (pause?.start || pause?.end) {
    const ps = String(pause.start ?? "");
    const pe = String(pause.end ?? "");
    if (!TIME_RE.test(ps) || !TIME_RE.test(pe) || toMinutes(ps) >= toMinutes(pe)) {
      return NextResponse.json({ error: "Horaires de pause invalides." }, { status: 400 });
    }
    if (toMinutes(ps) <= toMinutes(startTime) || toMinutes(pe) >= toMinutes(endTime)) {
      return NextResponse.json({ error: "La pause doit être comprise dans la journée." }, { status: 400 });
    }
    ranges = [
      [startTime, ps],
      [pe, endTime],
    ];
  }
  ranges = ranges.filter(([s, e]) => toMinutes(e) - toMinutes(s) >= duration);
  if (ranges.length === 0) {
    return NextResponse.json(
      { error: "Ces horaires sont trop courts pour une seule séance de cette durée." },
      { status: 400 }
    );
  }

  const values = days.flatMap((dayOfWeek) =>
    ranges.map(([s, e]) => ({
      entrepreneurId: entrepreneur.id,
      dayOfWeek,
      startTime: s,
      endTime: e,
      slotDurationMinutes: duration,
    }))
  );

  // Remplacement atomique : suppression des anciens horaires de ces jours
  // et ajout des nouveaux dans un même lot.
  const [, inserted] = await db.batch([
    db
      .delete(schema.availabilities)
      .where(
        and(
          eq(schema.availabilities.entrepreneurId, entrepreneur.id),
          inArray(schema.availabilities.dayOfWeek, days)
        )
      ),
    db.insert(schema.availabilities).values(values).returning(),
  ]);

  return NextResponse.json({ rules: inserted }, { status: 201 });
}
