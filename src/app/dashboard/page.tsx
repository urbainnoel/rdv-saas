import { db, schema } from "@/db";
import { and, eq, gte, ne, asc } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";
import { CalendarIcon } from "@/components/icons";
import AppointmentActions from "./AppointmentActions";
import { formatDateFr, formatTimeFr, safeTimeZone } from "@/lib/timezone";

export default async function DashboardPage() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return null;

  const now = new Date();
  const tz = safeTimeZone(entrepreneur.timezone);

  const upcoming = await db
    .select({
      appointment: schema.appointments,
      client: schema.clients,
      service: schema.services,
    })
    .from(schema.appointments)
    .innerJoin(schema.clients, eq(schema.appointments.clientId, schema.clients.id))
    .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
    .where(
      and(
        eq(schema.appointments.entrepreneurId, entrepreneur.id),
        gte(schema.appointments.startAt, now),
        ne(schema.appointments.status, "CANCELLED")
      )
    )
    .orderBy(asc(schema.appointments.startAt));

  return (
    <div>
      <h1 className="font-display font-extrabold tracking-tight text-2xl text-ink">Agenda</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Lien de réservation à partager :{" "}
        <span className="rounded bg-forest-soft px-1.5 py-0.5 font-mono text-xs text-forest">
          /{entrepreneur.slug}
        </span>
      </p>

      {upcoming.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <CalendarIcon className="h-8 w-8 text-ink-faint" />
          <p className="text-ink-soft">Aucun rendez-vous à venir.</p>
          <p className="max-w-sm text-sm text-ink-faint">
            Partage ton lien de réservation pour commencer à recevoir des
            demandes de rendez-vous.
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {upcoming.map(({ appointment, client, service }) => {
            const start = new Date(appointment.startAt);
            return (
              <div
                key={appointment.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{client.fullName}</p>
                  <p className="text-sm text-ink-soft">
                    {formatDateFr(start, tz)}{" "}
                    à {formatTimeFr(start, tz)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {client.phone ?? client.email ?? "—"}
                  </p>
                  {service && (
                    <p className="mt-2 inline-block rounded-full bg-amber-soft px-2.5 py-0.5 text-xs font-medium text-amber-dark">
                      {service.name}
                    </p>
                  )}
                  {appointment.notes && (
                    <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-sm text-ink-soft">
                      « {appointment.notes} »
                    </p>
                  )}
                </div>
                <AppointmentActions
                  appointmentId={appointment.id}
                  slug={entrepreneur.slug}
                  clientName={client.fullName}
                  timezone={tz}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
