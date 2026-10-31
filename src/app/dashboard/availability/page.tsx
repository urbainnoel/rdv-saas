import { db, schema } from "@/db";
import { and, asc, eq, gt } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { localDateKey, safeTimeZone } from "@/lib/timezone";
import AvailabilityManager from "./AvailabilityManager";
import AbsencesManager from "./AbsencesManager";
import { formatAbsenceLabel } from "./absences";

export default async function AvailabilityPage() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return null;

  const tz = safeTimeZone(entrepreneur.timezone);
  const now = new Date();

  const [rules, blocked] = await Promise.all([
    db
      .select({
        id: schema.availabilities.id,
        dayOfWeek: schema.availabilities.dayOfWeek,
        startTime: schema.availabilities.startTime,
        endTime: schema.availabilities.endTime,
        slotDurationMinutes: schema.availabilities.slotDurationMinutes,
      })
      .from(schema.availabilities)
      .where(eq(schema.availabilities.entrepreneurId, entrepreneur.id)),
    // Absences en cours ou à venir.
    db
      .select()
      .from(schema.blockedSlots)
      .where(and(eq(schema.blockedSlots.entrepreneurId, entrepreneur.id), gt(schema.blockedSlots.endAt, now)))
      .orderBy(asc(schema.blockedSlots.startAt)),
  ]);

  const absences = blocked.map((b) => ({
    id: b.id,
    label: formatAbsenceLabel(new Date(b.startAt), new Date(b.endAt), tz),
    reason: b.reason,
  }));

  return (
    <AvailabilityManager rules={rules}>
      <AbsencesManager absences={absences} todayKey={localDateKey(now, tz)} />
    </AvailabilityManager>
  );
}
