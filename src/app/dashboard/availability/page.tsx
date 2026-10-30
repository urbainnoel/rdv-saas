import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import AvailabilityManager from "./AvailabilityManager";

export default async function AvailabilityPage() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return null;

  const rules = await db
    .select({
      id: schema.availabilities.id,
      dayOfWeek: schema.availabilities.dayOfWeek,
      startTime: schema.availabilities.startTime,
      endTime: schema.availabilities.endTime,
      slotDurationMinutes: schema.availabilities.slotDurationMinutes,
    })
    .from(schema.availabilities)
    .where(eq(schema.availabilities.entrepreneurId, entrepreneur.id));

  return <AvailabilityManager rules={rules} />;
}
