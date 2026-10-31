import { db, schema } from "@/db";
import { and, asc, eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import ServiceManager from "./ServiceManager";

export default async function ServicesPage() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return null;

  const services = await db
    .select({
      id: schema.services.id,
      name: schema.services.name,
      description: schema.services.description,
      durationMinutes: schema.services.durationMinutes,
      priceLabel: schema.services.priceLabel,
    })
    .from(schema.services)
    .where(and(eq(schema.services.entrepreneurId, entrepreneur.id), eq(schema.services.archived, false)))
    .orderBy(asc(schema.services.createdAt));

  return <ServiceManager services={services} />;
}
