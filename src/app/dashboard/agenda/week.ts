// Calculs de la vue semaine de l'agenda, sans accès à la base (testables seuls).
// Toutes les clés de jour (AAAA-MM-JJ) sont dans le fuseau de l'entrepreneur.

import { addDaysToKey, dayOfWeekOfKey, localDateKey, zonedTimeToUtc } from "@/lib/timezone";

export type AgendaAppointment = {
  id: string;
  startAt: string; // ISO (UTC)
  endAt: string;
  status: string;
  clientName: string;
  clientContact: string | null;
  serviceName: string | null;
  notes: string | null;
};

export type AgendaAbsence = {
  id: string;
  startAt: string;
  endAt: string;
  reason: string | null;
};

export type WeekDay = {
  key: string;
  isToday: boolean;
  /** Absence qui couvre toute la journée (jour grisé). */
  fullDayAbsence: { reason: string | null } | null;
  /** Absences partielles de la journée, bornées à ce jour. */
  partialAbsences: { id: string; startAt: string; endAt: string; reason: string | null }[];
  appointments: AgendaAppointment[];
};

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Vrai si la clé est une date réelle (refuse 2026-02-31). */
export function isValidDateKey(key: string): boolean {
  if (!DATE_KEY_RE.test(key)) return false;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Lundi de la semaine qui contient ce jour (semaine à la française). */
export function mondayOfKey(key: string): string {
  const offset = (dayOfWeekOfKey(key) + 6) % 7;
  return addDaysToKey(key, -offset);
}

/** Paramètre d'URL `semaine` → lundi de la semaine ; semaine courante si absent ou invalide. */
export function resolveWeekStart(param: string | undefined, todayKey: string): string {
  return mondayOfKey(param && isValidDateKey(param) ? param : todayKey);
}

/** Bornes UTC [début, fin) d'une semaine locale. */
export function weekRange(mondayKey: string, tz: string): { start: Date; end: Date } {
  return {
    start: zonedTimeToUtc(mondayKey, "00:00", tz),
    end: zonedTimeToUtc(addDaysToKey(mondayKey, 7), "00:00", tz),
  };
}

/** Répartit RDV et absences sur les 7 jours (lundi → dimanche). */
export function buildWeek(
  mondayKey: string,
  tz: string,
  todayKey: string,
  appointments: AgendaAppointment[],
  absences: AgendaAbsence[]
): WeekDay[] {
  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const key = addDaysToKey(mondayKey, i);
    // Bornes réelles du jour local (23 h ou 25 h les jours de changement d'heure).
    const dayStart = zonedTimeToUtc(key, "00:00", tz).getTime();
    const dayEnd = zonedTimeToUtc(addDaysToKey(key, 1), "00:00", tz).getTime();

    let fullDayAbsence: WeekDay["fullDayAbsence"] = null;
    const partialAbsences: WeekDay["partialAbsences"] = [];
    for (const a of absences) {
      const s = new Date(a.startAt).getTime();
      const e = new Date(a.endAt).getTime();
      if (!(s < dayEnd && dayStart < e)) continue;
      if (s <= dayStart && e >= dayEnd) {
        fullDayAbsence ??= { reason: a.reason };
      } else {
        partialAbsences.push({
          id: a.id,
          startAt: new Date(Math.max(s, dayStart)).toISOString(),
          endAt: new Date(Math.min(e, dayEnd)).toISOString(),
          reason: a.reason,
        });
      }
    }

    days.push({
      key,
      isToday: key === todayKey,
      fullDayAbsence,
      partialAbsences: partialAbsences.sort((a, b) => a.startAt.localeCompare(b.startAt)),
      appointments: appointments
        .filter((a) => localDateKey(new Date(a.startAt), tz) === key)
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    });
  }
  return days;
}

/** Libellé d'une clé de jour : « lundi 3 novembre » (ou format court). */
export function formatDayKey(key: string, short = false): string {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: short ? "short" : "long",
    day: "numeric",
    month: short ? "short" : "long",
    timeZone: "UTC",
  });
}

/** « Aujourd'hui », « Demain » ou « lundi 3 novembre ». */
export function relativeDayLabel(key: string, todayKey: string): string {
  if (key === todayKey) return "Aujourd'hui";
  if (key === addDaysToKey(todayKey, 1)) return "Demain";
  if (key === addDaysToKey(todayKey, -1)) return "Hier";
  const label = formatDayKey(key);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
