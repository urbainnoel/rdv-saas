import { NextRequest, NextResponse } from "next/server";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { answerQuestion, ignoreQuestion } from "@/app/dashboard/questions/questions";

// { action: "answer", question, answer } → fiche FAQ créée + question traitée.
// { action: "ignore" } → question simplement marquée traitée.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (body?.action === "ignore") {
    if (!(await ignoreQuestion(entrepreneur.id, id))) {
      return NextResponse.json({ error: "Question introuvable ou déjà traitée." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "answer") {
    const result = await answerQuestion(entrepreneur.id, id, { question: body.question, answer: body.answer });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
}
