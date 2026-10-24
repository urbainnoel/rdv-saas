import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";

// On archive plutôt que supprimer, pour garder l'historique sur les RDV passés.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;

  await db
    .update(schema.services)
    .set({ archived: true })
    .where(and(eq(schema.services.id, id), eq(schema.services.entrepreneurId, entrepreneur.id)));

  return NextResponse.json({ ok: true });
}
