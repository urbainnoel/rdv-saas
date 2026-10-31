// Validation du formulaire « Disponibilités » (POST /api/dashboard/availability),
// sortie de la route pour pouvoir la tester sans base ni session.
// Fonction pure : renvoie soit un message d'erreur (en français, affiché tel
// quel à l'entrepreneur), soit les jours et les plages horaires à enregistrer.

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export type AvailabilityInput = {
  /** Jours choisis (0 = dimanche … 6 = samedi), sans doublon. */
  days: number[];
  /** Durée d'une séance, en minutes. */
  duration: number;
  /** Plages de travail : une seule, ou deux autour de la pause. */
  ranges: [string, string][];
};

// Corps JSON brut, non fiable : chaque champ est vérifié ci-dessous.
type RawBody =
  | {
      daysOfWeek?: unknown;
      dayOfWeek?: unknown;
      startTime?: unknown;
      endTime?: unknown;
      slotDurationMinutes?: unknown;
      pause?: { start?: unknown; end?: unknown } | null;
    }
  | null
  | undefined;

export type AvailabilityInputResult = { ok: true; value: AvailabilityInput } | { ok: false; error: string };

/**
 * Corps attendu : { daysOfWeek: number[], startTime: "09:00", endTime: "17:00",
 * slotDurationMinutes: 60, pause?: { start: "12:30", end: "14:00" } }.
 * Ancien format { dayOfWeek: number } accepté.
 */
export function parseAvailabilityInput(body: unknown): AvailabilityInputResult {
  const b = body as RawBody;
  const rawDays: unknown = b?.daysOfWeek ?? (typeof b?.dayOfWeek === "number" ? [b.dayOfWeek] : null);
  const startTime = String(b?.startTime ?? "");
  const endTime = String(b?.endTime ?? "");
  const duration = Number(b?.slotDurationMinutes ?? 30);
  const pause = b?.pause;

  const days = Array.isArray(rawDays)
    ? [...new Set(rawDays)].filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];
  if (days.length === 0) {
    return { ok: false, error: "Choisis au moins un jour." };
  }
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    return { ok: false, error: "Horaires invalides." };
  }
  if (toMinutes(startTime) >= toMinutes(endTime)) {
    return { ok: false, error: "L'heure de fin doit être après l'heure de début." };
  }
  if (!Number.isInteger(duration) || duration < 10 || duration > 480) {
    return { ok: false, error: "Durée de séance invalide (entre 10 min et 8 h)." };
  }

  // Plages de travail : une seule, ou deux autour de la pause.
  let ranges: [string, string][] = [[startTime, endTime]];
  if (pause?.start || pause?.end) {
    const ps = String(pause.start ?? "");
    const pe = String(pause.end ?? "");
    if (!TIME_RE.test(ps) || !TIME_RE.test(pe) || toMinutes(ps) >= toMinutes(pe)) {
      return { ok: false, error: "Horaires de pause invalides." };
    }
    if (toMinutes(ps) <= toMinutes(startTime) || toMinutes(pe) >= toMinutes(endTime)) {
      return { ok: false, error: "La pause doit être comprise dans la journée." };
    }
    ranges = [
      [startTime, ps],
      [pe, endTime],
    ];
  }
  ranges = ranges.filter(([s, e]) => toMinutes(e) - toMinutes(s) >= duration);
  if (ranges.length === 0) {
    return { ok: false, error: "Ces horaires sont trop courts pour une seule séance de cette durée." };
  }

  return { ok: true, value: { days, duration, ranges } };
}
