import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { notificationEmail } = body ?? {};

  if (notificationEmail !== null && notificationEmail !== undefined) {
    const value = String(notificationEmail).trim();
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    await db
      .update(schema.entrepreneurs)
      .set({ notificationEmail: value || null })
      .where(eq(schema.entrepreneurs.id, entrepreneur.id));
  }

  return NextResponse.json({ ok: true });
}
