// Prospects captés par l'assistant : enregistrement (sans doublon) et
// passage automatique en « converti » quand le prospect finit par réserver.

import { db, schema } from "@/db";
import { and, eq, inArray } from "drizzle-orm";

export const LEAD_STATUSES = ["NEW", "CONTACTED", "CONVERTED", "LOST"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function normalizeContact(contact: string): string {
  const value = contact.trim();
  if (value.includes("@")) return value.toLowerCase();
  return value.replace(/[\s().-]/g, "");
}

/**
 * Enregistre un prospect. Retourne true seulement s'il est nouveau, pour ne
 * notifier l'entrepreneur qu'une fois (l'assistant renvoie le même contact à
 * chaque message suivant de la conversation).
 */
export async function saveLead(input: {
  entrepreneurId: string;
  name: string;
  contact: string;
  context: string | null;
}): Promise<boolean> {
  const inserted = await db
    .insert(schema.leads)
    .values({
      entrepreneurId: input.entrepreneurId,
      name: input.name.slice(0, 80),
      contact: normalizeContact(input.contact),
      context: input.context?.slice(0, 1000) ?? null,
    })
    .onConflictDoNothing({ target: [schema.leads.entrepreneurId, schema.leads.contact] })
    .returning({ id: schema.leads.id });
  return inserted.length > 0;
}

/** Un prospect qui réserve devient « converti ». */
export async function markLeadConverted(
  entrepreneurId: string,
  contacts: Array<string | null | undefined>
) {
  const normalized = contacts.filter((c): c is string => Boolean(c)).map(normalizeContact);
  if (normalized.length === 0) return;
  await db
    .update(schema.leads)
    .set({ status: "CONVERTED", updatedAt: new Date() })
    .where(and(eq(schema.leads.entrepreneurId, entrepreneurId), inArray(schema.leads.contact, normalized)));
}
