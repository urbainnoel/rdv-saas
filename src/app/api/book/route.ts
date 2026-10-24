import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { createAppointment } from "@/lib/booking";
import { rateLimit, clientIp } from "@/lib/rate-limit";

type BookBody = {
  slug: string;
  startAt: string; // ISO
  endAt: string; // ISO
  client: {
    fullName: string;
    email?: string;
    phone?: string;
  };
  serviceId?: string;
  notes?: string;
};

export async function POST(req: NextRequest) {
  if (!(await rateLimit(`book:ip:${clientIp(req)}`, 10, 60 * 60))) {
    return NextResponse.json(
      { error: "Trop de réservations depuis cette connexion. Réessayez plus tard." },
      { status: 429 }
    );
  }

  let body: BookBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const { slug, startAt, endAt, client, serviceId, notes } = body;

  if (!slug || !startAt || !endAt || !client?.fullName) {
    return NextResponse.json(
      { error: "Champs requis manquants (slug, startAt, endAt, client.fullName)." },
      { status: 400 }
    );
  }

  const [entrepreneur] = await db
    .select()
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.slug, slug))
    .limit(1);

  if (!entrepreneur) {
    return NextResponse.json({ error: "Entrepreneur introuvable." }, { status: 404 });
  }

  const result = await createAppointment({
    entrepreneur,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
    client,
    serviceId,
    notes,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ appointment: result.appointment }, { status: 201 });
}
