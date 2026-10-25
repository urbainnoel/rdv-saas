import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { emailVerificationRequired } from "@/lib/email-verification";
import { findEntrepreneurByEmail } from "@/lib/accounts";

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

  const entrepreneur = await findEntrepreneurByEmail(String(email));

  if (!entrepreneur) {
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  }

  // Compte créé avec Google : pas de mot de passe à comparer.
  if (!entrepreneur.passwordHash) {
    return NextResponse.json(
      { error: "Ce compte a été créé avec Google : utilise « Continuer avec Google »." },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, entrepreneur.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  }

  // Le mot de passe est vérifié AVANT ce contrôle : on ne révèle donc pas
  // à un inconnu qu'un compte existe et attend sa confirmation.
  if (emailVerificationRequired() && !entrepreneur.emailVerifiedAt) {
    return NextResponse.json(
      {
        error: "Confirme d'abord ton adresse email : ouvre le lien que nous t'avons envoyé.",
        needsVerification: true,
      },
      { status: 403 }
    );
  }

  await createSession({ entrepreneurId: entrepreneur.id });

  return NextResponse.json({ entrepreneur: { id: entrepreneur.id, slug: entrepreneur.slug } });
}
