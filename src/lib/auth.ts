import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getSession } from "./session";

export async function getCurrentEntrepreneur() {
  const session = await getSession();
  if (!session) return null;

  const [entrepreneur] = await db
    .select()
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.id, session.entrepreneurId))
    .limit(1);

  return entrepreneur ?? null;
}
