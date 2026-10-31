import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, ne, sql } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/timezone";
import { normalizeSlug, slugError } from "@/lib/slug";

const BUSINESS_NAME_MIN = 2;
const BUSINESS_NAME_MAX = 80;
const SLUG_TAKEN = "Ce lien est déjà pris par une autre activité. Essaie une variante (ex. ajoute ta ville).";

// Violation d'unicité Postgres (23505), que l'erreur vienne du driver ou soit enveloppée par Drizzle.
function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export async function PATCH(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { notificationEmail, timezone, businessName, slug } = body ?? {};

  // On valide tout avant d'écrire quoi que ce soit : une requête invalide ne modifie rien.
  const updates: Partial<typeof schema.entrepreneurs.$inferInsert> = {};

  if (timezone !== undefined) {
    if (typeof timezone !== "string" || !isValidTimeZone(timezone)) {
      return NextResponse.json({ error: "Fuseau horaire invalide." }, { status: 400 });
    }
    updates.timezone = timezone;
  }

  if (notificationEmail !== null && notificationEmail !== undefined) {
    const value = String(notificationEmail).trim();
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    updates.notificationEmail = value || null;
  }

  if (businessName !== undefined) {
    // Espaces multiples réduits : le nom s'affiche en titre sur la page publique.
    const value = typeof businessName === "string" ? businessName.replace(/\s+/g, " ").trim() : "";
    if (value.length < BUSINESS_NAME_MIN || value.length > BUSINESS_NAME_MAX) {
      return NextResponse.json(
        { error: `Le nom de l'activité doit faire entre ${BUSINESS_NAME_MIN} et ${BUSINESS_NAME_MAX} caractères.` },
        { status: 400 }
      );
    }
    updates.businessName = value;
  }

  if (slug !== undefined) {
    if (typeof slug !== "string") {
      return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
    }
    const value = normalizeSlug(slug);
    if (value !== entrepreneur.slug) {
      const error = slugError(value);
      if (error) return NextResponse.json({ error }, { status: 400 });

      // L'index unique en base est sensible à la casse : on vérifie aussi sans casse,
      // pour ne pas avoir « Fatou » et « fatou » sur deux comptes.
      const [taken] = await db
        .select({ id: schema.entrepreneurs.id })
        .from(schema.entrepreneurs)
        .where(
          and(
            sql`lower(${schema.entrepreneurs.slug}) = ${value}`,
            ne(schema.entrepreneurs.id, entrepreneur.id)
          )
        )
        .limit(1);
      if (taken) return NextResponse.json({ error: SLUG_TAKEN }, { status: 409 });
      updates.slug = value;
    }
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  try {
    const [updated] = await db
      .update(schema.entrepreneurs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.entrepreneurs.id, entrepreneur.id))
      .returning({ businessName: schema.entrepreneurs.businessName, slug: schema.entrepreneurs.slug });
    return NextResponse.json({ ok: true, ...updated });
  } catch (err) {
    // Deux comptes qui prennent le même lien à la même seconde : l'index unique tranche.
    if (isUniqueViolation(err)) return NextResponse.json({ error: SLUG_TAKEN }, { status: 409 });
    throw err;
  }
}
