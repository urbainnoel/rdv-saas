import { NextResponse } from "next/server";

// Route de diagnostic TEMPORAIRE — à supprimer une fois le problème Groq résolu.
// Interroge Groq directement avec la clé que Vercel a réellement en mémoire,
// pour vérifier si c'est bien elle qui est en cause (sans passer par le chat).
export async function GET() {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: "GROQ_API_KEY absente de l'environnement." });
  }

  const masked = `${apiKey.slice(0, 6)}...${apiKey.slice(-4)} (longueur: ${apiKey.length})`;

  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const body = await res.text();

  return NextResponse.json({
    ok: res.ok,
    status: res.status,
    cleEnvironnement: masked,
    reponseGroq: body.slice(0, 2000),
  });
}
