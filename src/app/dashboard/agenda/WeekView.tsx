// Vue semaine (lundi → dimanche, fuseau de l'entrepreneur).
// Mobile : jours empilés ; grand écran : 7 colonnes.

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { addDaysToKey, formatTimeFr } from "@/lib/timezone";
import { formatDayKey, type WeekDay } from "./week";

function weekTitle(mondayKey: string): string {
  const sunday = addDaysToKey(mondayKey, 6);
  const fmt = (key: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${key}T12:00:00Z`).toLocaleDateString("fr-FR", { ...opts, timeZone: "UTC" });
  const sameMonth = mondayKey.slice(0, 7) === sunday.slice(0, 7);
  const from = sameMonth ? fmt(mondayKey, { day: "numeric" }) : fmt(mondayKey, { day: "numeric", month: "short" });
  return `${from} – ${fmt(sunday, { day: "numeric", month: "short", year: "numeric" })}`;
}

// Majuscule au jour seulement (« Lun. 2 nov. », pas « Lun. 2 Nov. »).
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const STATUS_NOTE: Record<string, string> = { COMPLETED: "Venu", NO_SHOW: "Absent" };

export default function WeekView({
  mondayKey,
  currentMondayKey,
  days,
  tz,
}: {
  mondayKey: string;
  currentMondayKey: string;
  days: WeekDay[];
  tz: string;
}) {
  const href = (key: string) => `/dashboard/agenda?vue=semaine&semaine=${key}`;
  const navButton =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-surface text-ink-soft transition hover:border-forest hover:text-forest";
  const total = days.reduce((n, d) => n + d.appointments.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href={href(addDaysToKey(mondayKey, -7))} aria-label="Semaine précédente" className={navButton}>
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="font-extrabold text-ink">{weekTitle(mondayKey)}</p>
          <p className="text-xs text-ink-faint">
            {total === 0 ? "Aucun rendez-vous" : `${total} rendez-vous`}
            {mondayKey !== currentMondayKey && (
              <>
                {" · "}
                <Link href={href(currentMondayKey)} className="font-semibold text-forest underline">
                  Cette semaine
                </Link>
              </>
            )}
          </p>
        </div>
        <Link href={href(addDaysToKey(mondayKey, 7))} aria-label="Semaine suivante" className={navButton}>
          <ChevronRightIcon className="h-5 w-5" />
        </Link>
      </div>

      <ol className="grid grid-cols-1 gap-2 lg:grid-cols-7">
        {days.map((day) => {
          const absent = day.fullDayAbsence;
          const empty = day.appointments.length === 0 && day.partialAbsences.length === 0;
          return (
            <li
              key={day.key}
              aria-current={day.isToday ? "date" : undefined}
              className={`flex flex-col gap-2 rounded-2xl border p-3 lg:min-h-48 ${
                absent
                  ? "border-dashed border-border bg-[repeating-linear-gradient(135deg,var(--color-paper)_0_8px,transparent_8px_16px)] bg-surface"
                  : day.isToday
                    ? "border-forest bg-surface"
                    : "border-border bg-surface"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2 lg:flex-col lg:items-start lg:gap-0">
                <p className={`font-extrabold ${day.isToday ? "text-forest" : absent ? "text-ink-faint" : "text-ink"}`}>
                  {capitalize(formatDayKey(day.key, true))}
                </p>
                {day.isToday && <p className="text-xs font-bold text-forest">Aujourd&apos;hui</p>}
              </div>

              {absent && (
                <p className="rounded-lg bg-paper px-2 py-1.5 text-xs font-semibold text-ink-soft">
                  Absent{absent.reason ? ` · ${absent.reason}` : ""}
                </p>
              )}

              {day.partialAbsences.map((p) => (
                <p key={p.id} className="rounded-lg bg-paper px-2 py-1.5 text-xs font-semibold text-ink-soft">
                  Absent {formatTimeFr(new Date(p.startAt), tz)}–{formatTimeFr(new Date(p.endAt), tz)}
                  {p.reason ? ` · ${p.reason}` : ""}
                </p>
              ))}

              {day.appointments.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {day.appointments.map((a) => (
                    <li key={a.id} className="rounded-lg border-l-4 border-forest bg-forest-soft/60 px-2 py-1.5">
                      <p className="text-xs font-extrabold text-forest">
                        {formatTimeFr(new Date(a.startAt), tz)}
                        {STATUS_NOTE[a.status] && (
                          <span className="ml-1 font-semibold text-ink-soft">· {STATUS_NOTE[a.status]}</span>
                        )}
                      </p>
                      <p className="break-words text-sm font-bold leading-snug text-ink">{a.clientName}</p>
                      {a.serviceName && <p className="break-words text-xs text-ink-soft">{a.serviceName}</p>}
                    </li>
                  ))}
                </ul>
              )}

              {empty && !absent && <p className="text-xs text-ink-faint">Rien de prévu</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
