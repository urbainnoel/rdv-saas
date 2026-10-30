// Fin de l'inscription via Google : crée le compte avec le nom d'activité.

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { GOOGLE_PENDING_COOKIE, type GoogleProfile } from "@/lib/google";
import { createEntrepreneurAccount, findEntrepreneurByEmail } from "@/lib/accounts";
import { createSession, verifyTemporaryToken } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { destinationFor, parseIntent } from "@/lib/intent";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(GOOGLE_PENDING_COOKIE)?.value ?? "";
  const profile = await verifyTemporaryToken<GoogleProfile & { intent?: string | null }>("google-signup", token);
  if (!profile) {
    return NextResponse.json(
      { error: "La connexion Google a expiré. Recommence avec « Continuer avec Google »." },
      { status: 401 }
    );
  }

  if (!(await rateLimit(`signup:ip:${clientIp(req)}`, 5, 60 * 60))) {
    return NextResponse.json(
      { error: "Trop de créations de compte depuis cette connexion. Réessaie dans une heure." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const businessName = typeof body?.businessName === "string" ? body.businessName.trim() : "";
  if (businessName.length < 2) {
    return NextResponse.json({ error: "Indique le nom de ton activité." }, { status: 400 });
  }

  // Un compte a pu être créé entre-temps (double clic, autre onglet).
  const [linked] = await db
    .select()
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.googleId, profile.sub))
    .limit(1);
  const existing = linked ?? (await findEntrepreneurByEmail(profile.email));

  if (existing && !existing.googleId) {
    await db
      .update(schema.entrepreneurs)
      .set({ googleId: profile.sub, emailVerifiedAt: existing.emailVerifiedAt ?? new Date() })
      .where(eq(schema.entrepreneurs.id, existing.id));
  }

  const entrepreneur =
    existing ??
    (await createEntrepreneurAccount({
      email: profile.email,
      businessName,
      passwordHash: null,
      googleId: profile.sub,
      emailVerifiedAt: new Date(), // email vérifié par Google
    }));

  await createSession({ entrepreneurId: entrepreneur.id });
  const res = NextResponse.json({ ok: true, redirect: destinationFor(parseIntent(profile.intent)) });
  res.cookies.delete(GOOGLE_PENDING_COOKIE);
  return res;
}
