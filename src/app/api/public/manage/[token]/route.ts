import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { cancelByToken, rescheduleByToken, rescheduleOptions, isWellFormedToken } from "@/app/rdv/manage";

// API publique du lien de gestion /rdv/<jeton> (sans compte : le jeton fait
// office de clé). Limitée en débit par adresse IP.

type Params = { params: Promise<{ token: string }> };

function tooMany() {
  return NextResponse.json(
    { error: "Trop de tentatives depuis cette connexion. Réessayez dans quelques minutes." },
    { status: 429 }
  );
}

// Créneaux libres pour un report.
export async function GET(req: NextRequest, { params }: Params) {
  if (!(await rateLimit(`manage:read:${clientIp(req)}`, 60, 10 * 60))) return tooMany();
  const { token } = await params;
  if (!isWellFormedToken(token)) return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });

  const options = await rescheduleOptions(token);
  if (!options) return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  return NextResponse.json(options, { headers: { "Cache-Control": "no-store" } });
}

// { action: "cancel" } ou { action: "reschedule", startAt, endAt } (ISO).
export async function POST(req: NextRequest, { params }: Params) {
  if (!(await rateLimit(`manage:write:${clientIp(req)}`, 15, 60 * 60))) return tooMany();
  const { token } = await params;
  const body = await req.json().catch(() => null);

  let result;
  if (body?.action === "cancel") {
    result = await cancelByToken(token);
  } else if (body?.action === "reschedule" && typeof body.startAt === "string" && typeof body.endAt === "string") {
    result = await rescheduleByToken(token, new Date(body.startAt), new Date(body.endAt));
  } else {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error, reason: result.reason ?? null }, { status: result.status });
  }
  return NextResponse.json({ ok: true, startAt: result.startAt.toISOString(), endAt: result.endAt.toISOString() });
}
