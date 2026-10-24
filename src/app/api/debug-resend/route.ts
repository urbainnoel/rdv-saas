import { NextResponse } from "next/server";

// Route de diagnostic TEMPORAIRE — à supprimer une fois le problème email résolu.
export async function GET() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: "RESEND_API_KEY absente de l'environnement." });
  }

  const masked = `${apiKey.slice(0, 6)}...${apiKey.slice(-4)} (longueur: ${apiKey.length})`;

  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const body = await res.text();

  return NextResponse.json({
    ok: res.ok,
    status: res.status,
    cleEnvironnement: masked,
    reponseResend: body.slice(0, 1000),
  });
}
