import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, password } = body ?? {};

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  // Anti force brute : limite par adresse IP et par compte visé.
  const [ipOk, emailOk] = await Promise.all([
    rateLimit(`login:ip:${clientIp(req)}`, 20, 15 * 60),
    rateLimit(`login:email:${String(email).toLowerCase()}`, 8, 15 * 60),
  ]);
  if (!ipOk || !emailOk) {
    return NextResponse.json(
      { error: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
      { status: 429 }
    );
  }

  const [entrepreneur] = await db
    .select()
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.email, email))
    .limit(1);

  if (!entrepreneur) {
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, entrepreneur.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  }

  await createSession({ entrepreneurId: entrepreneur.id });

  return NextResponse.json({ entrepreneur: { id: entrepreneur.id, slug: entrepreneur.slug } });
}
