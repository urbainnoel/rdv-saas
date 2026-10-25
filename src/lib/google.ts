// Connexion avec Google (OAuth 2.0 / OpenID Connect, flux « code » + PKCE).
// Configuration : GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans Vercel.
// URI de redirection à déclarer chez Google : {origine}/api/auth/google/callback

import { createHash, randomBytes } from "crypto";
import { decodeJwt } from "jose";

export const GOOGLE_OAUTH_COOKIE = "google_oauth";
export const GOOGLE_PENDING_COOKIE = "google_pending";

export type GoogleProfile = { sub: string; email: string; name: string };

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

function redirectUri(origin: string) {
  return `${origin}/api/auth/google/callback`;
}

const b64url = (buf: Buffer) => buf.toString("base64url");

/** Prépare la redirection vers Google : renvoie l'URL et les secrets à garder en cookie. */
export function startGoogleAuth(origin: string) {
  const state = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!.trim());
  url.searchParams.set("redirect_uri", redirectUri(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  return { url: url.toString(), state, verifier };
}

/**
 * Échange le code contre le profil. Le jeton d'identité arrive directement
 * de Google par HTTPS (pas via le navigateur) : on contrôle son émetteur,
 * son destinataire et sa validité, et on exige un email vérifié par Google.
 */
export async function finishGoogleAuth(origin: string, code: string, verifier: string): Promise<GoogleProfile> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(origin),
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("Google: id_token manquant.");

  const claims = decodeJwt(id_token);
  const validIssuer = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  const validAudience = claims.aud === process.env.GOOGLE_CLIENT_ID!.trim();
  const notExpired = typeof claims.exp === "number" && claims.exp * 1000 > Date.now();
  if (!validIssuer || !validAudience || !notExpired) throw new Error("Google: jeton d'identité invalide.");
  if (claims.email_verified !== true || typeof claims.email !== "string" || typeof claims.sub !== "string") {
    throw new Error("Google: email non vérifié.");
  }

  return {
    sub: claims.sub,
    email: claims.email,
    name: typeof claims.name === "string" ? claims.name : "",
  };
}
