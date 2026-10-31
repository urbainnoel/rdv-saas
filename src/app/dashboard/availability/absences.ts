// Libellé lisible d'une absence, dans le fuseau de l'entrepreneur.

import { formatDateFr, formatTimeFr, localDateKey } from "@/lib/timezone";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatAbsenceLabel(start: Date, end: Date, tz: string): string {
  const isMidnight = (d: Date) => formatTimeFr(d, tz) === "00:00";
  const startDay = formatDateFr(start, tz);

  if (isMidnight(start) && isMidnight(end)) {
    // Journées entières : la fin est le minuit qui suit le dernier jour.
    const lastDay = new Date(end.getTime() - 1);
    if (localDateKey(start, tz) === localDateKey(lastDay, tz)) return `${cap(startDay)} (journée entière)`;
    return `Du ${startDay} au ${formatDateFr(lastDay, tz)}`;
  }

  if (localDateKey(start, tz) === localDateKey(end, tz)) {
    return `${cap(startDay)}, ${formatTimeFr(start, tz)} – ${formatTimeFr(end, tz)}`;
  }
  return `Du ${startDay} ${formatTimeFr(start, tz)} au ${formatDateFr(end, tz)} ${formatTimeFr(end, tz)}`;
}
