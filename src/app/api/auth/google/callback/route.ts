// Retour de Google : connecte un compte existant (lié par Google ou par
// email), ou démarre la création d'un compte en ne demandant que le nom
// de l'activité.

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { GOOGLE_OAUTH_COOKIE, GOOGLE_PENDING_COOKIE, finishGoogleAuth } from "@/lib/google";
import { findEntrepreneurByEmail } from "@/lib/accounts";
import { createSession, signTemporaryToken } from "@/lib/session";
import { destinationFor, parseIntent } from "@/lib/intent";

export async function GET(req: NextRequest) {
  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/login?google=${reason}`, req.url));
    res.cookies.delete({ name: GOOGLE_OAUTH_COOKIE, path: "/api/auth/google" });
    return res;
  };

  const params = req.nextUrl.searchParams;
  if (params.get("error")) return fail("cancelled"); // l'utilisateur a refusé chez Google

  let saved: { state?: string; verifier?: string; intent?: string | null } = {};
  try {
    saved = JSON.parse(req.cookies.get(GOOGLE_OAUTH_COOKIE)?.value ?? "{}");
  } catch {}
  const code = params.get("code");
  if (!code || !saved.state || !saved.verifier || params.get("state") !== saved.state) {
    return fail("error");
  }

  let profile;
  try {
    profile = await finishGoogleAuth(req.nextUrl.origin, code, saved.verifier);
  } catch (err) {
    console.error("[google] Échec de la connexion:", err);
    return fail("error");
  }

  // 1. Compte déjà lié à ce compte Google
  let [entrepreneur] = await db
    .select()
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.googleId, profile.sub))
    .limit(1);

  // 2. Compte existant avec le même email (créé avec mot de passe) : on le
  //    lie à Google. Google a vérifié l'email, donc il est aussi confirmé.
  if (!entrepreneur) {
    const byEmail = await findEntrepreneurByEmail(profile.email);
    if (byEmail) {
      [entrepreneur] = await db
        .update(schema.entrepreneurs)
        .set({ googleId: profile.sub, emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date() })
        .where(eq(schema.entrepreneurs.id, byEmail.id))
        .returning();
    }
  }

  if (entrepreneur) {
    await createSession({ entrepreneurId: entrepreneur.id });
    const res = NextResponse.redirect(new URL(destinationFor(parseIntent(saved.intent)), req.url));
    res.cookies.delete({ name: GOOGLE_OAUTH_COOKIE, path: "/api/auth/google" });
    return res;
  }

  // 3. Nouveau compte : il ne manque que le nom de l'activité.
  const pending = await signTemporaryToken(
    "google-signup",
    { ...profile, intent: parseIntent(saved.intent) },
    "30m"
  );
  const res = NextResponse.redirect(new URL("/signup/google", req.url));
  res.cookies.delete({ name: GOOGLE_OAUTH_COOKIE, path: "/api/auth/google" });
  res.cookies.set(GOOGLE_PENDING_COOKIE, pending, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60,
  });
  return res;
}
