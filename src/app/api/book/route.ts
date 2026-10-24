import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, ne } from "drizzle-orm";
import { sendAppointmentConfirmation } from "@/lib/notifications";

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

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export async function POST(req: NextRequest) {
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
  if (!client.email && !client.phone) {
    return NextResponse.json(
      { error: "Il faut au moins un email ou un numéro de téléphone pour le client." },
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

  let validServiceId: string | null = null;
  if (serviceId) {
    const [service] = await db
      .select()
      .from(schema.services)
      .where(and(eq(schema.services.id, serviceId), eq(schema.services.entrepreneurId, entrepreneur.id)))
      .limit(1);
    if (!service) {
      return NextResponse.json({ error: "Service invalide." }, { status: 400 });
    }
    validServiceId = service.id;
  }

  const start = new Date(startAt);
  const end = new Date(endAt);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return NextResponse.json({ error: "Créneau invalide." }, { status: 400 });
  }
  if (start.getTime() < Date.now()) {
    return NextResponse.json({ error: "Ce créneau est déjà passé." }, { status: 400 });
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
    overlaps(start, end, new Date(a.startAt), new Date(a.endAt))
  );

  if (conflict) {
    return NextResponse.json(
      { error: "Ce créneau vient d'être réservé par quelqu'un d'autre. Merci d'en choisir un autre." },
      { status: 409 }
    );
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
      startAt: start,
      endAt: end,
      status: "CONFIRMED",
      notes: notes ?? null,
    })
    .returning();

  // Envoi de la confirmation (email/WhatsApp) — ne bloque pas la réponse en cas d'échec
  sendAppointmentConfirmation({ entrepreneur, client: clientRecord, appointment }).catch(
    (err) => console.error("Erreur envoi confirmation:", err)
  );

  return NextResponse.json({ appointment }, { status: 201 });
}
