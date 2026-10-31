import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, asc, eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { validateServiceInput } from "./validate";

export async function GET() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const list = await db
    .select()
    .from(schema.services)
    .where(
      and(eq(schema.services.entrepreneurId, entrepreneur.id), eq(schema.services.archived, false))
    )
    .orderBy(asc(schema.services.createdAt));

  return NextResponse.json({ services: list });
}

export async function POST(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const result = validateServiceInput(body, { partial: false });
  if (result.error !== undefined) return NextResponse.json({ error: result.error }, { status: 400 });
  const v = result.values;

  const [service] = await db
    .insert(schema.services)
    .values({
      entrepreneurId: entrepreneur.id,
      name: v.name!,
      description: v.description ?? null,
      durationMinutes: v.durationMinutes ?? null,
      priceLabel: v.priceLabel ?? null,
    })
    .returning();

  return NextResponse.json({ service }, { status: 201 });
}
