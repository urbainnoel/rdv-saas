import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";

export async function GET() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const entries = await db
    .select()
    .from(schema.knowledgeBaseEntries)
    .where(eq(schema.knowledgeBaseEntries.entrepreneurId, entrepreneur.id));

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { question, answer, type } = body ?? {};

  const allowedTypes = ["faq", "info", "logic"];
  const safeType = allowedTypes.includes(type) ? type : "faq";

  if (!question || !answer) {
    return NextResponse.json({ error: "Les deux champs sont requis." }, { status: 400 });
  }

  const [entry] = await db
    .insert(schema.knowledgeBaseEntries)
    .values({ entrepreneurId: entrepreneur.id, question, answer, type: safeType })
    .returning();

  return NextResponse.json({ entry }, { status: 201 });
}
