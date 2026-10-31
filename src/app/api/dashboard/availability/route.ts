import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { parseAvailabilityInput } from "@/lib/availability-input";

export async function GET() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const rules = await db
    .select()
    .from(schema.availabilities)
    .where(eq(schema.availabilities.entrepreneurId, entrepreneur.id));

  return NextResponse.json({ rules });
}

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
  const parsed = parseAvailabilityInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { days, duration, ranges } = parsed.value;

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
