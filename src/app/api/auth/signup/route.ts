import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { emailVerificationRequired, sendVerificationEmail } from "@/lib/email-verification";
import { createEntrepreneurAccount, findEntrepreneurByEmail } from "@/lib/accounts";

export async function POST(req: NextRequest) {
  if (!(await rateLimit(`signup:ip:${clientIp(req)}`, 5, 60 * 60))) {
    return NextResponse.json(
      { error: "Trop de créations de compte depuis cette connexion. Réessayez dans une heure." },
      { status: 429 }
    );
  }

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

  if (await findEntrepreneurByEmail(email)) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 }
    );
  }

  const required = emailVerificationRequired();
  const entrepreneur = await createEntrepreneurAccount({
    email,
    businessName,
    passwordHash: await bcrypt.hash(password, 10),
    // Sans confirmation obligatoire, le compte est considéré confirmé d'office.
    emailVerifiedAt: required ? null : new Date(),
  });

  if (required) {
    // Pas de session tant que l'adresse n'est pas confirmée.
    await sendVerificationEmail(entrepreneur, req.nextUrl.origin);
    return NextResponse.json({ needsVerification: true, email }, { status: 201 });
  }

  await createSession({ entrepreneurId: entrepreneur.id });

  return NextResponse.json(
    { entrepreneur: { id: entrepreneur.id, slug: entrepreneur.slug } },
    { status: 201 }
  );
}
