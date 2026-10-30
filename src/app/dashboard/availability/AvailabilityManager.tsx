"use client";

import { useEffect, useState } from "react";

type Rule = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
};

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function AvailabilityManager() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await fetch("/api/dashboard/availability");
    const data = await res.json();
    setRules(data.rules ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek,
          startTime,
          endTime,
          slotDurationMinutes: slotDuration,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/dashboard/availability/${id}`, { method: "DELETE" });
    await load();
  }

  const rulesByDay = Array.from({ length: 7 }, (_, d) => ({
    day: d,
    rules: rules
      .filter((r) => r.dayOfWeek === d)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  return (
    <div>
      <h1 className="font-display font-extrabold tracking-tight text-2xl text-ink">Disponibilités</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Définis tes créneaux récurrents, semaine après semaine.
      </p>

      <form
        onSubmit={handleAdd}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4"
      >
        <div>
          <label className="block text-xs font-medium text-ink-soft">Jour</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="mt-1 rounded-2xl border border-border bg-surface px-2.5 py-2 text-sm text-ink focus:border-forest"
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-soft">Début</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 rounded-2xl border border-border bg-surface px-2.5 py-2 text-sm text-ink focus:border-forest"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-soft">Fin</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 rounded-2xl border border-border bg-surface px-2.5 py-2 text-sm text-ink focus:border-forest"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-soft">
            Durée créneau (min)
          </label>
          <input
            type="number"
            min={10}
            step={5}
            value={slotDuration}
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            className="mt-1 w-24 rounded-2xl border border-border bg-surface px-2.5 py-2 text-sm text-ink focus:border-forest"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-forest px-4 py-1.5 text-sm font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>
      {error && (
        <p className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {!loading && (
        <div className="mt-6 space-y-3">
          {rulesByDay.map(({ day, rules }) => (
            <div key={day} className="rounded-2xl border border-border bg-surface p-4">
              <p className="font-medium text-ink">{DAYS[day]}</p>
              {rules.length === 0 ? (
                <p className="mt-1 text-sm text-ink-faint">Fermé</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {rules.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between text-sm text-ink-soft"
                    >
                      <span>
                        {r.startTime} – {r.endTime}{" "}
                        <span className="text-ink-faint">
                          (créneaux de {r.slotDurationMinutes} min)
                        </span>
                      </span>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-xs text-danger hover:underline"
                      >
                        Supprimer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
