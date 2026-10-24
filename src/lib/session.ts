import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";
// En production, un secret manquant ou trop court permettrait à n'importe
// qui de fabriquer une session valide : on refuse alors de signer ou de
// vérifier quoi que ce soit plutôt que de retomber sur une valeur connue.
function getSecret(): Uint8Array {
  const value = process.env.SESSION_SECRET?.trim();
  if (value && value.length >= 32) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET manquant ou trop court (32 caractères minimum).");
  }
  return new TextEncoder().encode("dev-only-insecure-secret-change-me");
}

export type SessionPayload = {
  entrepreneurId: string;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
