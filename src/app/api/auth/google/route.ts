// Bouton « Continuer avec Google » : redirige vers l'écran de choix de compte Google.

import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_OAUTH_COOKIE, googleConfigured, startGoogleAuth } from "@/lib/google";
import { parseIntent } from "@/lib/intent";

export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/login?google=unavailable", req.url));
  }

  const { url, state, verifier } = startGoogleAuth(req.nextUrl.origin);
  const res = NextResponse.redirect(url);
  res.cookies.set(GOOGLE_OAUTH_COOKIE, JSON.stringify({ state, verifier, intent: parseIntent(req.nextUrl.searchParams.get("intent")) }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 10 * 60,
  });
  return res;
}
