import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
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

export async function POST(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { dayOfWeek, startTime, endTime, slotDurationMinutes } = body ?? {};

  if (
    typeof dayOfWeek !== "number" ||
    dayOfWeek < 0 ||
    dayOfWeek > 6 ||
    !startTime ||
    !endTime
  ) {
    return NextResponse.json({ error: "Champs invalides." }, { status: 400 });
  }
  if (startTime >= endTime) {
    return NextResponse.json(
      { error: "L'heure de fin doit être après l'heure de début." },
      { status: 400 }
    );
  }

  const [rule] = await db
    .insert(schema.availabilities)
    .values({
      entrepreneurId: entrepreneur.id,
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes: slotDurationMinutes ?? 30,
    })
    .returning();

  return NextResponse.json({ rule }, { status: 201 });
}
