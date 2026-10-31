// Questions posées à l'assistant restées sans réponse (rubrique « Questions »).
// Partagé entre la page et l'API ; tout est TOUJOURS filtré par entrepreneur.

import { db, schema } from "@/db";
import { and, desc, eq, isNull } from "drizzle-orm";

const MAX_QUESTION = 1000; // même plafond que l'enregistrement côté chat
const MAX_ANSWER = 2000;

export async function listOpenQuestions(entrepreneurId: string) {
  return db
    .select({
      id: schema.unansweredQuestions.id,
      question: schema.unansweredQuestions.question,
      createdAt: schema.unansweredQuestions.createdAt,
    })
    .from(schema.unansweredQuestions)
    .where(
      and(
        eq(schema.unansweredQuestions.entrepreneurId, entrepreneurId),
        isNull(schema.unansweredQuestions.resolvedAt)
      )
    )
    .orderBy(desc(schema.unansweredQuestions.createdAt));
}

/** Marque la question traitée ; false si elle n'existe pas, est déjà traitée ou appartient à un autre compte. */
async function markResolved(entrepreneurId: string, id: string): Promise<boolean> {
  const [row] = await db
    .update(schema.unansweredQuestions)
    .set({ resolvedAt: new Date() })
    .where(
      and(
        eq(schema.unansweredQuestions.id, id),
        eq(schema.unansweredQuestions.entrepreneurId, entrepreneurId),
        isNull(schema.unansweredQuestions.resolvedAt)
      )
    )
    .returning({ id: schema.unansweredQuestions.id });
  return Boolean(row);
}

export async function ignoreQuestion(entrepreneurId: string, id: string): Promise<boolean> {
  return markResolved(entrepreneurId, id);
}

export type AnswerResult = { ok: true } | { ok: false; status: number; error: string };

/**
 * Répond à une question : crée une fiche FAQ dans la bibliothèque de
 * l'assistant (comme POST /api/dashboard/knowledge-base, type "faq") puis la
 * marque traitée. On marque d'abord (garde contre un double envoi), et on
 * annule ce marquage si la fiche n'a pas pu être créée.
 */
export async function answerQuestion(
  entrepreneurId: string,
  id: string,
  input: { question: unknown; answer: unknown }
): Promise<AnswerResult> {
  const question = typeof input.question === "string" ? input.question.trim() : "";
  const answer = typeof input.answer === "string" ? input.answer.trim() : "";
  if (!question || !answer) return { ok: false, status: 400, error: "La question et la réponse sont requises." };
  if (question.length > MAX_QUESTION || answer.length > MAX_ANSWER) {
    return { ok: false, status: 400, error: "Texte trop long : raccourcis la question ou la réponse." };
  }

  if (!(await markResolved(entrepreneurId, id))) {
    return { ok: false, status: 404, error: "Question introuvable ou déjà traitée." };
  }

  try {
    await db.insert(schema.knowledgeBaseEntries).values({ entrepreneurId, question, answer, type: "faq" });
  } catch (err) {
    await db
      .update(schema.unansweredQuestions)
      .set({ resolvedAt: null })
      .where(
        and(eq(schema.unansweredQuestions.id, id), eq(schema.unansweredQuestions.entrepreneurId, entrepreneurId))
      );
    throw err;
  }
  return { ok: true };
}
