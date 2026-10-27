// Fuseaux horaires sans dépendance externe, avec l'API Intl du runtime.
//
// Principe : les dates sont stockées en UTC ; les règles de disponibilité
// (« lundi 9:00–17:00 ») et tous les affichages s'interprètent dans le
// fuseau de l'entrepreneur (colonne entrepreneurs.timezone, ex. Africa/Conakry).
// Une « clé de jour » est une date locale au format AAAA-MM-JJ.

export const DEFAULT_TIMEZONE = "Africa/Conakry";

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function safeTimeZone(tz: string | null | undefined): string {
  return tz && isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE;
}

/** Décalage (ms) entre l'heure locale du fuseau et l'UTC, à cet instant. */
function offsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - (date.getTime() - date.getMilliseconds());
}

/** Clé du jour local (AAAA-MM-JJ) d'un instant, dans le fuseau donné. */
export function localDateKey(date: Date, tz: string): string {
  // en-CA formate naturellement en AAAA-MM-JJ.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Instant UTC correspondant à « tel jour local, telle heure locale » dans le fuseau. */
export function zonedTimeToUtc(dateKey: string, time: string, tz: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  // Deux passes pour tomber juste autour des changements d'heure (été/hiver).
  const first = naive - offsetMs(new Date(naive), tz);
  const second = naive - offsetMs(new Date(first), tz);
  return new Date(second);
}

export function addDaysToKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Jour de la semaine (0 = dimanche) d'une clé de jour. */
export function dayOfWeekOfKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** « lundi 3 novembre » dans le fuseau donné. */
export function formatDateFr(date: Date, tz: string): string {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: tz });
}

/** « 14:30 » dans le fuseau donné. */
export function formatTimeFr(date: Date, tz: string): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: tz });
}

/** Fuseaux proposés en premier dans les Paramètres (Afrique francophone, Europe, Canada). */
export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: "Africa/Conakry", label: "Guinée (Conakry)" },
  { value: "Africa/Dakar", label: "Sénégal (Dakar)" },
  { value: "Africa/Abidjan", label: "Côte d'Ivoire (Abidjan)" },
  { value: "Africa/Bamako", label: "Mali (Bamako)" },
  { value: "Africa/Ouagadougou", label: "Burkina Faso (Ouagadougou)" },
  { value: "Africa/Lome", label: "Togo (Lomé)" },
  { value: "Africa/Porto-Novo", label: "Bénin (Porto-Novo)" },
  { value: "Africa/Niamey", label: "Niger (Niamey)" },
  { value: "Africa/Douala", label: "Cameroun (Douala)" },
  { value: "Africa/Libreville", label: "Gabon (Libreville)" },
  { value: "Africa/Kinshasa", label: "RD Congo (Kinshasa)" },
  { value: "Africa/Lubumbashi", label: "RD Congo (Lubumbashi)" },
  { value: "Africa/Brazzaville", label: "Congo (Brazzaville)" },
  { value: "Africa/Casablanca", label: "Maroc (Casablanca)" },
  { value: "Africa/Algiers", label: "Algérie (Alger)" },
  { value: "Africa/Tunis", label: "Tunisie (Tunis)" },
  { value: "Indian/Antananarivo", label: "Madagascar (Antananarivo)" },
  { value: "Europe/Paris", label: "France (Paris)" },
  { value: "Europe/Brussels", label: "Belgique (Bruxelles)" },
  { value: "Europe/Zurich", label: "Suisse (Zurich)" },
  { value: "America/Montreal", label: "Canada (Montréal)" },
];
