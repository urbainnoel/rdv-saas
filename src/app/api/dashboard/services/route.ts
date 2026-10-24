import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";

export async function GET() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const list = await db
    .select()
    .from(schema.services)
    .where(
      and(eq(schema.services.entrepreneurId, entrepreneur.id), eq(schema.services.archived, false))
    );

  return NextResponse.json({ services: list });
}

export async function POST(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { name, description, durationMinutes } = body ?? {};

  if (!name) {
    return NextResponse.json({ error: "Le nom du service est requis." }, { status: 400 });
  }

  const [service] = await db
    .insert(schema.services)
    .values({
      entrepreneurId: entrepreneur.id,
      name,
      description: description || null,
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
    })
    .returning();

  return NextResponse.json({ service }, { status: 201 });
}
