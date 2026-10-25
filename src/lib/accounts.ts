// Création d'un compte entrepreneur, partagée entre l'inscription classique
// (email + mot de passe) et l'inscription via Google.

import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { DEFAULT_MESSAGE_TEMPLATES } from "./enums";

type Entrepreneur = typeof schema.entrepreneurs.$inferSelect;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(businessName: string): Promise<string> {
  const baseSlug = slugify(businessName) || "entreprise";
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const [conflict] = await db
      .select({ id: schema.entrepreneurs.id })
      .from(schema.entrepreneurs)
      .where(eq(schema.entrepreneurs.slug, slug))
      .limit(1);
    if (!conflict) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

/** Recherche un compte par email, sans tenir compte des majuscules. */
export async function findEntrepreneurByEmail(email: string): Promise<Entrepreneur | null> {
  const [found] = await db
    .select()
    .from(schema.entrepreneurs)
    .where(sql`lower(${schema.entrepreneurs.email}) = ${email.trim().toLowerCase()}`)
    .limit(1);
  return found ?? null;
}

export async function createEntrepreneurAccount(input: {
  email: string;
  businessName: string;
  passwordHash: string | null;
  googleId?: string | null;
  emailVerifiedAt: Date | null;
}): Promise<Entrepreneur> {
  const slug = await uniqueSlug(input.businessName);

  const [entrepreneur] = await db
    .insert(schema.entrepreneurs)
    .values({
      email: input.email,
      passwordHash: input.passwordHash,
      googleId: input.googleId ?? null,
      businessName: input.businessName,
      slug,
      emailVerifiedAt: input.emailVerifiedAt,
    })
    .returning();

  // Modèles de messages par défaut
  await db.insert(schema.messageTemplates).values(
    Object.entries(DEFAULT_MESSAGE_TEMPLATES).map(([type, content]) => ({
      entrepreneurId: entrepreneur.id,
      type,
      content,
      enabled: true,
    }))
  );

  return entrepreneur;
}
