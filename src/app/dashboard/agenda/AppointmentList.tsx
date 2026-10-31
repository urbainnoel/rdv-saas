// Liste des RDV regroupés par jour (onglets « À venir » et « Passés »).
// Composant sans accès à la base : les données arrivent en props.

import { CalendarIcon } from "@/components/icons";
import { formatTimeFr, localDateKey } from "@/lib/timezone";
import AppointmentActions from "../AppointmentActions";
import AttendanceActions from "./AttendanceActions";
import StatusBadge from "./StatusBadge";
import { relativeDayLabel, type AgendaAppointment } from "./week";

export default function AppointmentList({
  appointments,
  tab,
  tz,
  slug,
  todayKey,
}: {
  appointments: AgendaAppointment[];
  tab: "a-venir" | "passes";
  tz: string;
  slug: string;
  todayKey: string;
}) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
        <CalendarIcon className="h-8 w-8 text-ink-faint" />
        {tab === "a-venir" ? (
          <>
            <p className="font-semibold text-ink-soft">Aucun rendez-vous à venir.</p>
            <p className="max-w-sm text-sm text-ink-faint">
              Partage ton lien de réservation, ou ajoute toi-même le rendez-vous d&apos;un client qui t&apos;a appelé.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-ink-soft">Aucun rendez-vous ces 30 derniers jours.</p>
            <p className="max-w-sm text-sm text-ink-faint">
              Après chaque rendez-vous, reviens ici pour noter si le client est venu.
            </p>
          </>
        )}
      </div>
    );
  }

  // Regroupement par jour local, dans l'ordre reçu (croissant ou décroissant).
  const groups: { key: string; items: AgendaAppointment[] }[] = [];
  for (const a of appointments) {
    const key = localDateKey(new Date(a.startAt), tz);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(a);
    else groups.push({ key, items: [a] });
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <section key={group.key} aria-label={relativeDayLabel(group.key, todayKey)}>
          <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-ink-soft">
            {relativeDayLabel(group.key, todayKey)}
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {group.items.map((a) => {
              const start = new Date(a.startAt);
              const end = new Date(a.endAt);
              const cancelled = a.status === "CANCELLED";
              return (
                <li
                  key={a.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <div className="flex min-w-0 gap-4">
                    <div className="w-14 shrink-0">
                      <p className={`text-lg font-extrabold leading-tight ${cancelled ? "text-ink-faint line-through" : "text-ink"}`}>
                        {formatTimeFr(start, tz)}
                      </p>
                      <p className="text-xs text-ink-faint">{formatTimeFr(end, tz)}</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-ink">{a.clientName}</p>
                        {tab === "passes" && <StatusBadge status={a.status} />}
                      </div>
                      <p className="mt-0.5 break-words text-sm text-ink-soft">{a.clientContact ?? "—"}</p>
                      {a.serviceName && (
                        <p className="mt-2 inline-block rounded-full bg-amber-soft px-2.5 py-0.5 text-xs font-semibold text-amber-dark">
                          {a.serviceName}
                        </p>
                      )}
                      {a.notes && (
                        <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-sm text-ink-soft">« {a.notes} »</p>
                      )}
                    </div>
                  </div>
                  {tab === "a-venir" ? (
                    <AppointmentActions appointmentId={a.id} slug={slug} clientName={a.clientName} timezone={tz} />
                  ) : (
                    !cancelled && (
                      <AttendanceActions appointmentId={a.id} status={a.status} clientName={a.clientName} />
                    )
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
