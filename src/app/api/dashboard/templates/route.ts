import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";

export async function GET() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const templates = await db
    .select()
    .from(schema.messageTemplates)
    .where(eq(schema.messageTemplates.entrepreneurId, entrepreneur.id));

  return NextResponse.json({ templates });
}

export async function PUT(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { type, content, enabled } = body ?? {};

  if (!type || typeof content !== "string") {
    return NextResponse.json({ error: "Champs invalides." }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(schema.messageTemplates)
    .where(
      and(
        eq(schema.messageTemplates.entrepreneurId, entrepreneur.id),
        eq(schema.messageTemplates.type, type)
      )
    )
    .limit(1);

  let template;
  if (existing) {
    [template] = await db
      .update(schema.messageTemplates)
      .set({ content, enabled: enabled ?? existing.enabled })
      .where(eq(schema.messageTemplates.id, existing.id))
      .returning();
  } else {
    [template] = await db
      .insert(schema.messageTemplates)
      .values({ entrepreneurId: entrepreneur.id, type, content, enabled: enabled ?? true })
      .returning();
  }

  return NextResponse.json({ template });
}
