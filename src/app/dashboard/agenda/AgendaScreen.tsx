// Écran de l'agenda, sans accès à la base (page.tsx charge les données).

import Link from "next/link";
import AddAppointmentForm, { type ServiceOption } from "./AddAppointmentForm";
import AppointmentList from "./AppointmentList";
import WeekView from "./WeekView";
import type { AgendaAppointment, WeekDay } from "./week";

export type AgendaScreenProps = {
  tz: string;
  slug: string;
  todayKey: string;
  defaultDate: string;
  defaultTime: string;
  services: ServiceOption[];
  addFormOpen?: boolean;
} & (
  | { view: "liste"; tab: "a-venir" | "passes"; appointments: AgendaAppointment[] }
  | { view: "semaine"; mondayKey: string; currentMondayKey: string; days: WeekDay[] }
);

function Segmented({ items }: { items: { href: string; label: string; active: boolean }[] }) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl border-2 border-border bg-surface p-1 sm:inline-grid">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={`flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-bold transition ${
            item.active ? "bg-forest text-white" : "text-ink-soft hover:text-forest"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export default function AgendaScreen(props: AgendaScreenProps) {
  const { tz, slug, todayKey, defaultDate, defaultTime, services, view } = props;

  return (
    <div className={`mx-auto flex flex-col gap-6 ${view === "semaine" ? "max-w-6xl" : "max-w-3xl"}`}>
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Agenda</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Tes rendez-vous, ceux pris en ligne comme ceux que tu ajoutes toi-même.
        </p>
      </div>

      <AddAppointmentForm
        services={services}
        minDate={todayKey}
        defaultDate={defaultDate}
        defaultTime={defaultTime}
        initiallyOpen={props.addFormOpen}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          items={[
            { href: "/dashboard/agenda", label: "Liste", active: view === "liste" },
            { href: "/dashboard/agenda?vue=semaine", label: "Semaine", active: view === "semaine" },
          ]}
        />
        {props.view === "liste" && (
          <nav aria-label="Période" className="flex gap-1 border-b-2 border-border">
            {[
              { href: "/dashboard/agenda", label: "À venir", active: props.tab === "a-venir" },
              { href: "/dashboard/agenda?onglet=passes", label: "Passés (30 j)", active: props.tab === "passes" },
            ].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={t.active ? "page" : undefined}
                className={`-mb-0.5 flex min-h-11 flex-1 items-center justify-center border-b-2 px-4 text-sm font-bold sm:flex-none ${
                  t.active ? "border-forest text-forest" : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {props.view === "liste" ? (
        <AppointmentList appointments={props.appointments} tab={props.tab} tz={tz} slug={slug} todayKey={todayKey} />
      ) : (
        <WeekView mondayKey={props.mondayKey} currentMondayKey={props.currentMondayKey} days={props.days} tz={tz} />
      )}
    </div>
  );
}
