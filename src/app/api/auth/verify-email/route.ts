// Lien reçu par email : confirme l'adresse, ouvre la session et redirige
// vers le tableau de bord (ou vers la connexion si le lien n'est plus valable).

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, gt } from "drizzle-orm";
import { hashToken } from "@/lib/email-verification";
import { createSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const invalid = NextResponse.redirect(new URL("/login?verification=invalid", req.url));
  if (!/^[a-f0-9]{64}$/.test(token)) return invalid;

  const [entrepreneur] = await db
    .update(schema.entrepreneurs)
    .set({
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    })
    .where(
      and(
        eq(schema.entrepreneurs.emailVerificationTokenHash, hashToken(token)),
        gt(schema.entrepreneurs.emailVerificationExpiresAt, new Date())
      )
    )
    .returning();

  if (!entrepreneur) return invalid;

  await createSession({ entrepreneurId: entrepreneur.id });
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
