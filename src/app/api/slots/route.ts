import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getAvailableSlotsForRange } from "@/lib/slots";

// GET /api/slots?slug=fatou-coach&days=14
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const days = Number(req.nextUrl.searchParams.get("days") ?? "14");

  if (!slug) {
    return NextResponse.json({ error: "Le paramètre 'slug' est requis." }, { status: 400 });
  }

  const [entrepreneur] = await db
    .select()
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.slug, slug))
    .limit(1);

  if (!entrepreneur) {
    return NextResponse.json({ error: "Entrepreneur introuvable." }, { status: 404 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [slotsByDay, services] = await Promise.all([
    getAvailableSlotsForRange(entrepreneur.id, today, days),
    db
      .select()
      .from(schema.services)
      .where(
        and(eq(schema.services.entrepreneurId, entrepreneur.id), eq(schema.services.archived, false))
      ),
  ]);

  return NextResponse.json({
    entrepreneur: {
      businessName: entrepreneur.businessName,
      slug: entrepreneur.slug,
    },
    services,
    slotsByDay,
  });
}
