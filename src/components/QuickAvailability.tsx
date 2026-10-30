"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Saisie rapide des disponibilités, dans l'ordre où on y pense :
// 1. combien de temps dure une séance, 2. quels jours, 3. quels horaires.
// Utilisée dans la mise en route de l'accueil et sur la page Disponibilités.

const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 h" },
  { value: 90, label: "1 h 30" },
  { value: 120, label: "2 h" },
];

// Semaine à la française (lundi en premier) ; valeur = jour JS (0 = dimanche).
const WEEK = [
  { value: 1, short: "Lun", long: "lundi" },
  { value: 2, short: "Mar", long: "mardi" },
  { value: 3, short: "Mer", long: "mercredi" },
  { value: 4, short: "Jeu", long: "jeudi" },
  { value: 5, short: "Ven", long: "vendredi" },
  { value: 6, short: "Sam", long: "samedi" },
  { value: 0, short: "Dim", long: "dimanche" },
];

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

function formatDuration(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 === 0 ? `${h} h` : `${h} h ${m % 60}`;
}

export default function QuickAvailability({
  submitLabel = "Enregistrer mes horaires",
  onSaved,
}: {
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [duration, setDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState(false);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [withPause, setWithPause] = useState(false);
  const [pauseStart, setPauseStart] = useState("12:30");
  const [pauseEnd, setPauseEnd] = useState("14:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggleDay(d: number) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
    setSaved(false);
  }

  // Aperçu : nombre de séances par jour avec ces réglages.
  const ranges: [number, number][] = withPause
    ? [
        [toMin(start), toMin(pauseStart)],
        [toMin(pauseEnd), toMin(end)],
      ]
    : [[toMin(start), toMin(end)]];
  const perDay = duration > 0 ? ranges.reduce((n, [a, b]) => n + Math.max(0, Math.floor((b - a) / duration)), 0) : 0;
  const orderedDays = WEEK.filter((d) => days.includes(d.value));

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/dashboard/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        daysOfWeek: days,
        startTime: start,
        endTime: end,
        slotDurationMinutes: duration,
        pause: withPause ? { start: pauseStart, end: pauseEnd } : null,
      }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      setError(data?.error ?? "Enregistrement impossible pour le moment.");
      return;
    }
    setSaved(true);
    onSaved?.();
    router.refresh();
  }

  const chip = (active: boolean) =>
    `min-h-11 rounded-xl px-3.5 text-sm font-bold transition ${
      active ? "bg-forest text-white" : "border-2 border-border bg-surface text-ink hover:border-forest"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="text-sm font-bold text-ink">1. Durée moyenne d&apos;une séance</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              aria-pressed={!customDuration && duration === d.value}
              onClick={() => {
                setDuration(d.value);
                setCustomDuration(false);
                setSaved(false);
              }}
              className={chip(!customDuration && duration === d.value)}
            >
              {d.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={customDuration}
            onClick={() => setCustomDuration(true)}
            className={chip(customDuration)}
          >
            Autre
          </button>
        </div>
        {customDuration && (
          <label className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="number"
              min={10}
              max={480}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-24 rounded-xl border border-border bg-surface px-3 py-2.5 text-ink focus:border-forest"
            />
            minutes
          </label>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold text-ink">2. Jours de travail</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEK.map((d) => (
            <button
              key={d.value}
              type="button"
              aria-pressed={days.includes(d.value)}
              aria-label={d.long}
              onClick={() => toggleDay(d.value)}
              className={`${chip(days.includes(d.value))} w-14 px-0`}
            >
              {d.short}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
          <button type="button" onClick={() => setDays([1, 2, 3, 4, 5])} className="text-forest underline">
            Lundi → vendredi
          </button>
          <button type="button" onClick={() => setDays([1, 2, 3, 4, 5, 6])} className="text-forest underline">
            Lundi → samedi
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold text-ink">3. Horaires</legend>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <span>De</span>
          <input
            type="time"
            aria-label="Début de journée"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-ink focus:border-forest"
          />
          <span>à</span>
          <input
            type="time"
            aria-label="Fin de journée"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-ink focus:border-forest"
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={withPause}
            onChange={(e) => setWithPause(e.target.checked)}
            className="h-5 w-5 accent-forest"
          />
          Pause dans la journée
        </label>
        {withPause && (
          <div className="mt-2 flex flex-wrap items-center gap-2 pl-7 text-sm text-ink-soft">
            <span>De</span>
            <input
              type="time"
              aria-label="Début de la pause"
              value={pauseStart}
              onChange={(e) => setPauseStart(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-ink focus:border-forest"
            />
            <span>à</span>
            <input
              type="time"
              aria-label="Fin de la pause"
              value={pauseEnd}
              onChange={(e) => setPauseEnd(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-2.5 text-ink focus:border-forest"
            />
          </div>
        )}
      </fieldset>

      <p className="rounded-xl bg-forest-soft px-3.5 py-2.5 text-sm font-semibold text-forest" aria-live="polite">
        {orderedDays.length === 0
          ? "Choisis au moins un jour."
          : perDay === 0
            ? "Ces horaires sont trop courts pour une séance."
            : `${perDay} séance${perDay > 1 ? "s" : ""} de ${formatDuration(duration)} par jour, ${orderedDays.length} jour${orderedDays.length > 1 ? "s" : ""} par semaine.`}
      </p>

      {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving || orderedDays.length === 0 || perDay === 0}
        className="rounded-xl bg-forest px-4 py-3 font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : saved ? "Horaires enregistrés" : submitLabel}
      </button>
    </div>
  );
}
