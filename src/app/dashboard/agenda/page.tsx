import { db, schema } from "@/db";
import { and, asc, desc, eq, gt, gte, lt, ne, type SQL } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { addDaysToKey, localDateKey, safeTimeZone } from "@/lib/timezone";
import AgendaScreen from "./AgendaScreen";
import { buildWeek, mondayOfKey, resolveWeekStart, weekRange, type AgendaAppointment } from "./week";

const PAST_DAYS = 30;

/** Prochaine heure pleine locale, pour préremplir le formulaire d'ajout. */
function nextFullHour(now: Date, tz: string): { date: string; time: string } {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(now)
  );
  const today = localDateKey(now, tz);
  if (hour >= 23) return { date: addDaysToKey(today, 1), time: "09:00" };
  return { date: today, time: `${String(hour + 1).padStart(2, "0")}:00` };
}

export default async function AgendaPage({ searchParams }: PageProps<"/dashboard/agenda">) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return null;

  const params = await searchParams;
  const param = (name: string) => {
    const v = params[name];
    return typeof v === "string" ? v : undefined;
  };

  const now = new Date();
  const tz = safeTimeZone(entrepreneur.timezone);
  const todayKey = localDateKey(now, tz);
  const next = nextFullHour(now, tz);

  // Toujours filtré par entrepreneur : jamais les RDV d'un autre compte.
  const loadAppointments = async (where: SQL | undefined, order: "asc" | "desc") => {
    const rows = await db
      .select({ appointment: schema.appointments, client: schema.clients, service: schema.services })
      .from(schema.appointments)
      .innerJoin(schema.clients, eq(schema.appointments.clientId, schema.clients.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .where(and(eq(schema.appointments.entrepreneurId, entrepreneur.id), where))
      .orderBy(order === "asc" ? asc(schema.appointments.startAt) : desc(schema.appointments.startAt));
    return rows.map(
      ({ appointment, client, service }): AgendaAppointment => ({
        id: appointment.id,
        startAt: new Date(appointment.startAt).toISOString(),
        endAt: new Date(appointment.endAt).toISOString(),
        status: appointment.status,
        clientName: client.fullName,
        clientContact: client.phone ?? client.email ?? null,
        serviceName: service?.name ?? null,
        notes: appointment.notes,
      })
    );
  };

  const services = await db
    .select({
      id: schema.services.id,
      name: schema.services.name,
      durationMinutes: schema.services.durationMinutes,
    })
    .from(schema.services)
    .where(and(eq(schema.services.entrepreneurId, entrepreneur.id), eq(schema.services.archived, false)))
    .orderBy(asc(schema.services.name));

  const common = {
    tz,
    slug: entrepreneur.slug,
    todayKey,
    defaultDate: next.date,
    defaultTime: next.time,
    services,
  };

  if (param("vue") === "semaine") {
    const mondayKey = resolveWeekStart(param("semaine"), todayKey);
    const { start, end } = weekRange(mondayKey, tz);
    const [appointments, absences] = await Promise.all([
      loadAppointments(
        and(
          ne(schema.appointments.status, "CANCELLED"),
          gte(schema.appointments.startAt, start),
          lt(schema.appointments.startAt, end)
        ),
        "asc"
      ),
      db
        .select()
        .from(schema.blockedSlots)
        .where(
          and(
            eq(schema.blockedSlots.entrepreneurId, entrepreneur.id),
            lt(schema.blockedSlots.startAt, end),
            gt(schema.blockedSlots.endAt, start)
          )
        ),
    ]);
    const days = buildWeek(
      mondayKey,
      tz,
      todayKey,
      appointments,
      absences.map((b) => ({
        id: b.id,
        startAt: new Date(b.startAt).toISOString(),
        endAt: new Date(b.endAt).toISOString(),
        reason: b.reason,
      }))
    );
    return (
      <AgendaScreen
        {...common}
        view="semaine"
        mondayKey={mondayKey}
        currentMondayKey={mondayOfKey(todayKey)}
        days={days}
      />
    );
  }

  if (param("onglet") === "passes") {
    // RDV commencés depuis moins de 30 jours, du plus récent au plus ancien.
    const since = new Date(now.getTime() - PAST_DAYS * 24 * 3600 * 1000);
    const appointments = await loadAppointments(
      and(lt(schema.appointments.startAt, now), gte(schema.appointments.startAt, since)),
      "desc"
    );
    return <AgendaScreen {...common} view="liste" tab="passes" appointments={appointments} />;
  }

  const appointments = await loadAppointments(
    and(gte(schema.appointments.startAt, now), ne(schema.appointments.status, "CANCELLED")),
    "asc"
  );
  return <AgendaScreen {...common} view="liste" tab="a-venir" appointments={appointments} />;
}
