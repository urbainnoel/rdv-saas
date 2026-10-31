// Supprimer une absence : seulement si elle appartient à l'entrepreneur connecté.

import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const deleted = await db
    .delete(schema.blockedSlots)
    .where(and(eq(schema.blockedSlots.id, id), eq(schema.blockedSlots.entrepreneurId, entrepreneur.id)))
    .returning({ id: schema.blockedSlots.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Absence introuvable." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
