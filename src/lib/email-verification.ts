// Confirmation de l'adresse email à l'inscription.
//
// Interrupteur : EMAIL_VERIFICATION_REQUIRED="true" dans Vercel. À n'activer
// qu'une fois un domaine vérifié sur Resend (et RESEND_FROM défini) : sans
// domaine, Resend ne livre qu'à l'adresse du compte Resend, et les nouveaux
// inscrits ne recevraient jamais leur lien.

import { createHash, randomBytes } from "crypto";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { sendEmail } from "./notifications";

type Entrepreneur = typeof schema.entrepreneurs.$inferSelect;

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function emailVerificationRequired(): boolean {
  return process.env.EMAIL_VERIFICATION_REQUIRED?.trim().toLowerCase() === "true";
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Crée un nouveau jeton (l'ancien devient invalide) et envoie le lien. */
export async function sendVerificationEmail(entrepreneur: Entrepreneur, origin: string) {
  const token = randomBytes(32).toString("hex");
  await db
    .update(schema.entrepreneurs)
    .set({
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    })
    .where(eq(schema.entrepreneurs.id, entrepreneur.id));

  const link = `${origin}/api/auth/verify-email?token=${token}`;
  await sendEmail(
    entrepreneur.email,
    "Confirmez votre adresse email — RDV Assistant",
    `Bonjour,\n\nPour activer votre compte RDV Assistant (${entrepreneur.businessName}), confirmez votre adresse en ouvrant ce lien :\n\n${link}\n\nLe lien est valable 24 heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.`
  );
}
