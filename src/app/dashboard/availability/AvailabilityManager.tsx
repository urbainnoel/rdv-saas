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
    rules: rules.filter((r) => r.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold">Disponibilités</h1>
      <p className="mt-1 text-neutral-500">
        Définis tes créneaux récurrents, semaine après semaine.
      </p>

      <form
        onSubmit={handleAdd}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4"
      >
        <div>
          <label className="block text-xs font-medium text-neutral-600">Jour</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="mt-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600">Début</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600">Fin</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600">
            Durée créneau (min)
          </label>
          <input
            type="number"
            min={10}
            step={5}
            value={slotDuration}
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            className="mt-1 w-24 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {!loading && (
        <div className="mt-6 space-y-3">
          {rulesByDay.map(({ day, rules }) => (
            <div key={day} className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="font-medium">{DAYS[day]}</p>
              {rules.length === 0 ? (
                <p className="mt-1 text-sm text-neutral-400">Fermé</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {rules.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between text-sm text-neutral-700"
                    >
                      <span>
                        {r.startTime} – {r.endTime}{" "}
                        <span className="text-neutral-400">
                          (créneaux de {r.slotDurationMinutes} min)
                        </span>
                      </span>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-xs text-red-500 hover:underline"
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
