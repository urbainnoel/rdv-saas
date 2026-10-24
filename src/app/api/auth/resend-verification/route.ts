// Renvoie le lien de confirmation. Répond toujours la même chose, que le
// compte existe ou non, pour ne pas révéler quelles adresses sont inscrites.

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { emailVerificationRequired, sendVerificationEmail } from "@/lib/email-verification";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const done = NextResponse.json({ ok: true });

  if (!email || !emailVerificationRequired()) return done;

  const [ipOk, emailOk] = await Promise.all([
    rateLimit(`resend-verif:ip:${clientIp(req)}`, 10, 60 * 60),
    rateLimit(`resend-verif:email:${email.toLowerCase()}`, 3, 60 * 60),
  ]);
  if (!ipOk || !emailOk) return done;

  const [entrepreneur] = await db
    .select()
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.email, email))
    .limit(1);

  if (entrepreneur && !entrepreneur.emailVerifiedAt) {
    await sendVerificationEmail(entrepreneur, req.nextUrl.origin);
  }
  return done;
}
