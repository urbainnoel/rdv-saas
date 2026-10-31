import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { destroySession } from "@/lib/session";

// Comparaison tolérante (casse, espaces) : on veut une intention claire, pas un piège de frappe.
function sameName(a: string, b: string): boolean {
  const clean = (s: string) => s.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");
  return clean(a) === clean(b);
}

// Suppression définitive du compte. Toutes les tables liées (clients, RDV,
// services, disponibilités, modèles, bibliothèque, prospects, questions…)
// référencent l'entrepreneur avec ON DELETE CASCADE : une seule requête suffit.
export async function DELETE(req: NextRequest) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const confirmation = typeof body?.confirmation === "string" ? body.confirmation : "";
  if (!sameName(confirmation, entrepreneur.businessName)) {
    return NextResponse.json(
      { error: "Le nom saisi ne correspond pas au nom de ton activité." },
      { status: 400 }
    );
  }

  await db.delete(schema.entrepreneurs).where(eq(schema.entrepreneurs.id, entrepreneur.id));
  await destroySession();

  return NextResponse.json({ ok: true });
}
