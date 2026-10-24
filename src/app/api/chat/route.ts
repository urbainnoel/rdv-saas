import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { askAssistant, type ChatMessage } from "@/lib/chat";
import { notifyUnansweredQuestion, notifyNewLead } from "@/lib/notifications";

type ChatBody = {
  slug: string;
  messages: ChatMessage[];
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as ChatBody | null;

  if (!body?.slug || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const [entrepreneur] = await db
    .select()
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.slug, body.slug))
    .limit(1);

  if (!entrepreneur) {
    return NextResponse.json({ error: "Entrepreneur introuvable." }, { status: 404 });
  }

  const [entries, services] = await Promise.all([
    db
      .select({
        type: schema.knowledgeBaseEntries.type,
        question: schema.knowledgeBaseEntries.question,
        answer: schema.knowledgeBaseEntries.answer,
      })
      .from(schema.knowledgeBaseEntries)
      .where(eq(schema.knowledgeBaseEntries.entrepreneurId, entrepreneur.id)),
    db
      .select({ name: schema.services.name, description: schema.services.description })
      .from(schema.services)
      .where(and(eq(schema.services.entrepreneurId, entrepreneur.id), eq(schema.services.archived, false))),
  ]);

  try {
    const { answer, forward, lead } = await askAssistant({
      businessName: entrepreneur.businessName,
      slug: entrepreneur.slug,
      entries,
      services,
      history: body.messages,
    });

    if (forward) {
      const lastUserMessage = [...body.messages].reverse().find((m) => m.role === "user");
      notifyUnansweredQuestion({
        entrepreneur,
        question: lastUserMessage?.content ?? "(question non identifiée)",
      }).catch((err) => console.error("Erreur notification question non répondue:", err));
    }

    if (lead) {
      notifyNewLead({
        entrepreneur,
        leadName: lead.name,
        leadContact: lead.contact,
      }).catch((err) => console.error("Erreur notification nouveau prospect:", err));
    }

    return NextResponse.json({ answer, forward });
  } catch (err) {
    console.error("Erreur assistant:", err);
    return NextResponse.json(
      {
        answer:
          "Désolé, l'assistant rencontre un souci technique. Vous pouvez contacter l'entrepreneur directement.",
        forward: true,
      },
      { status: 200 }
    );
  }
}
