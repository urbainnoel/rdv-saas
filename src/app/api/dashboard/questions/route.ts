import { NextResponse } from "next/server";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { listOpenQuestions } from "@/app/dashboard/questions/questions";

// Questions sans réponse encore à traiter, les plus récentes d'abord.
export async function GET() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const questions = await listOpenQuestions(entrepreneur.id);
  return NextResponse.json({ questions });
}
