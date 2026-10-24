import { db, schema } from "@/db";
import { and, eq, gte, ne, asc } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";

export default async function DashboardPage() {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return null;

  const now = new Date().toISOString();

  const upcoming = await db
    .select({
      appointment: schema.appointments,
      client: schema.clients,
    })
    .from(schema.appointments)
    .innerJoin(schema.clients, eq(schema.appointments.clientId, schema.clients.id))
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
      <h1 className="text-2xl font-bold">Agenda</h1>
      <p className="mt-1 text-neutral-500">
        Lien de réservation à partager :{" "}
        <span className="font-mono text-sm">/{entrepreneur.slug}</span>
      </p>

      {upcoming.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          Aucun rendez-vous à venir. Partage ton lien de réservation pour commencer à recevoir
          des clients !
        </p>
      ) : (
        <div className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {upcoming.map(({ appointment, client }) => {
            const start = new Date(appointment.startAt);
            return (
              <div key={appointment.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{client.fullName}</p>
                  <p className="text-sm text-neutral-500">
                    {start.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    à {start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {client.phone ?? client.email ?? "—"}
                  </p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  {appointment.status === "CONFIRMED" ? "Confirmé" : appointment.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
