import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { DEFAULT_MESSAGE_TEMPLATES } from "@/lib/enums";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, password, businessName } = body ?? {};

  if (!email || !password || !businessName) {
    return NextResponse.json(
      { error: "Email, mot de passe et nom de l'activité sont requis." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit faire au moins 8 caractères." },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select()
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 }
    );
  }

  // Génère un slug unique à partir du nom d'activité
  const baseSlug = slugify(businessName) || "entreprise";
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const [conflict] = await db
      .select()
      .from(schema.entrepreneurs)
      .where(eq(schema.entrepreneurs.slug, slug))
      .limit(1);
    if (!conflict) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [entrepreneur] = await db
    .insert(schema.entrepreneurs)
    .values({ email, passwordHash, businessName, slug })
    .returning();

  // Templates de messages par défaut
  for (const [type, content] of Object.entries(DEFAULT_MESSAGE_TEMPLATES)) {
    await db.insert(schema.messageTemplates).values({
      entrepreneurId: entrepreneur.id,
      type,
      content,
      enabled: true,
    });
  }

  await createSession({ entrepreneurId: entrepreneur.id });

  return NextResponse.json({ entrepreneur: { id: entrepreneur.id, slug } }, { status: 201 });
}
