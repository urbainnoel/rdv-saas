import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import LeadList from "./LeadList";

export default async function LeadsPage() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return null;

  const leads = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.entrepreneurId, entrepreneur.id))
    .orderBy(desc(schema.leads.createdAt));

  return (
    <div>
      <h1 className="font-display font-extrabold tracking-tight text-2xl text-ink">Prospects</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Les personnes intéressées qui ont laissé leur contact à ton assistant sans réserver.
        Recontacte-les : un prospect qui réserve passe tout seul en « Converti ».
      </p>
      <LeadList
        businessName={entrepreneur.businessName}
        defaultCountryCode={entrepreneur.timezone === "Africa/Conakry" ? "224" : null}
        leads={leads.map((l) => ({
          id: l.id,
          name: l.name,
          contact: l.contact,
          context: l.context,
          status: l.status,
          createdAt: l.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
