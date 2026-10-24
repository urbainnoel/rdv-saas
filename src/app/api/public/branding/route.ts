import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

// Endpoint public minimal utilisé par /public/widget.js : il tourne sur le
// site de l'entrepreneur (hors de notre app React), donc il ne peut pas lire
// les variables CSS — il a besoin de la couleur de marque pour styler la
// bulle flottante elle-même.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Le paramètre 'slug' est requis." }, { status: 400 });
  }

  const [entrepreneur] = await db
    .select({
      businessName: schema.entrepreneurs.businessName,
      brandColor: schema.entrepreneurs.brandColor,
      logoUrl: schema.entrepreneurs.logoUrl,
    })
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.slug, slug))
    .limit(1);

  if (!entrepreneur) {
    return NextResponse.json({ error: "Entrepreneur introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    businessName: entrepreneur.businessName,
    brandColor: entrepreneur.brandColor ?? "#1f4d3d",
    logoUrl: entrepreneur.logoUrl ?? null,
  });
}
