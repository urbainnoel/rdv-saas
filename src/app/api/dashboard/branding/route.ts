import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { isValidHexColor } from "@/lib/color";

// Le logo est envoyé en data URL (base64), déjà redimensionné/compressé côté
// client — on limite tout de même la taille acceptée côté serveur par
// sécurité (~500 Ko encodé, largement suffisant pour un logo web).
const MAX_LOGO_LENGTH = 500_000;

export async function PATCH(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const updates: Partial<{ brandColor: string | null; logoUrl: string | null }> = {};

  if (body && "brandColor" in body) {
    const { brandColor } = body;
    if (brandColor !== null && !isValidHexColor(brandColor ?? "")) {
      return NextResponse.json({ error: "Couleur invalide (format attendu : #0b7a50)." }, { status: 400 });
    }
    updates.brandColor = brandColor ?? null;
  }

  if (body && "logoUrl" in body) {
    const { logoUrl } = body;
    if (logoUrl !== null) {
      if (typeof logoUrl !== "string" || !logoUrl.startsWith("data:image/")) {
        return NextResponse.json({ error: "Image invalide." }, { status: 400 });
      }
      if (logoUrl.length > MAX_LOGO_LENGTH) {
        return NextResponse.json({ error: "Le logo est trop volumineux." }, { status: 400 });
      }
    }
    updates.logoUrl = logoUrl ?? null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour." }, { status: 400 });
  }

  await db.update(schema.entrepreneurs).set(updates).where(eq(schema.entrepreneurs.id, entrepreneur.id));

  return NextResponse.json({ ok: true, ...updates });
}
