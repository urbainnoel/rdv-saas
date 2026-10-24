import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads";

// Change le statut d'un prospect (à recontacter, contacté, converti, perdu).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status as LeadStatus;
  if (!LEAD_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  const [updated] = await db
    .update(schema.leads)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(schema.leads.id, id), eq(schema.leads.entrepreneurId, entrepreneur.id)))
    .returning({ id: schema.leads.id });

  if (!updated) return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// Supprimer un prospect (ex. contact erroné).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  await db
    .delete(schema.leads)
    .where(and(eq(schema.leads.id, id), eq(schema.leads.entrepreneurId, entrepreneur.id)));
  return NextResponse.json({ ok: true });
}
