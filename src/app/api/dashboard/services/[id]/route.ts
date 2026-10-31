import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { validateServiceInput } from "../validate";

// Modification d'un service (nom, description, durée, prix). Seuls les champs
// envoyés changent ; un service archivé ou d'un autre compte reste introuvable.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const result = validateServiceInput(body, { partial: true });
  if (result.error !== undefined) return NextResponse.json({ error: result.error }, { status: 400 });
  if (Object.keys(result.values).length === 0) {
    return NextResponse.json({ error: "Rien à modifier." }, { status: 400 });
  }

  const [service] = await db
    .update(schema.services)
    .set(result.values)
    .where(
      and(
        eq(schema.services.id, id),
        eq(schema.services.entrepreneurId, entrepreneur.id),
        eq(schema.services.archived, false)
      )
    )
    .returning();

  if (!service) return NextResponse.json({ error: "Service introuvable." }, { status: 404 });
  return NextResponse.json({ service });
}

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
