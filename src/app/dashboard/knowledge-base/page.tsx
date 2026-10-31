import { db, schema } from "@/db";
import { asc, eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import KnowledgeBaseManager, { type Entry } from "./KnowledgeBaseManager";

export default async function KnowledgeBasePage() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return null;

  const rows = await db
    .select({
      id: schema.knowledgeBaseEntries.id,
      type: schema.knowledgeBaseEntries.type,
      question: schema.knowledgeBaseEntries.question,
      answer: schema.knowledgeBaseEntries.answer,
    })
    .from(schema.knowledgeBaseEntries)
    .where(eq(schema.knowledgeBaseEntries.entrepreneurId, entrepreneur.id))
    .orderBy(asc(schema.knowledgeBaseEntries.createdAt));

  // Type inconnu (anciennes données) : rangé avec les questions fréquentes, comme avant.
  const entries: Entry[] = rows.map((r) => ({
    ...r,
    type: r.type === "info" || r.type === "logic" ? r.type : "faq",
  }));

  return <KnowledgeBaseManager entries={entries} />;
}
