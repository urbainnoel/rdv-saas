import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { isValidHexColor } from "@/lib/color";

export async function PATCH(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { brandColor } = body ?? {};

  // null = revenir à la couleur par défaut de l'app.
  if (brandColor !== null && !isValidHexColor(brandColor ?? "")) {
    return NextResponse.json({ error: "Couleur invalide (format attendu : #1f4d3d)." }, { status: 400 });
  }

  await db
    .update(schema.entrepreneurs)
    .set({ brandColor: brandColor ?? null })
    .where(eq(schema.entrepreneurs.id, entrepreneur.id));

  return NextResponse.json({ ok: true, brandColor: brandColor ?? null });
}
