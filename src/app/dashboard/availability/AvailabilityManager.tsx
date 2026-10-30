"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuickAvailability from "@/components/QuickAvailability";

type Rule = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
};

// Semaine à la française : lundi en premier.
const WEEK = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

function formatDuration(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 === 0 ? `${h} h` : `${h} h ${m % 60}`;
}

export default function AvailabilityManager({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState(rules.length === 0);

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/dashboard/availability/${id}`, { method: "DELETE" }).catch(() => null);
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Disponibilités</h1>
        <p className="mt-1 text-sm text-ink-soft">Tes horaires de travail, chaque semaine.</p>
      </div>

      {editing ? (
        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-extrabold text-ink">
            {rules.length === 0 ? "Définis tes horaires" : "Modifier plusieurs jours d'un coup"}
          </h2>
          {rules.length > 0 && (
            <p className="mt-1 text-sm text-ink-soft">
              Les jours choisis prennent ces nouveaux horaires ; les autres ne changent pas.
            </p>
          )}
          <div className="mt-4">
            <QuickAvailability onSaved={() => setEditing(false)} />
          </div>
          {rules.length > 0 && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="mt-3 text-sm font-semibold text-ink-soft underline"
            >
              Annuler
            </button>
          )}
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="self-start rounded-xl bg-forest px-4 py-3 font-bold text-white transition hover:bg-forest-dark"
        >
          Modifier mes horaires
        </button>
      )}

      <section aria-label="Ma semaine" className="flex flex-col gap-2">
        {WEEK.map((day) => {
          const dayRules = rules
            .filter((r) => r.dayOfWeek === day.value)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <div
              key={day.value}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 py-3"
            >
              <p className="w-24 font-bold text-ink">{day.label}</p>
              {dayRules.length === 0 ? (
                <p className="flex-1 text-sm text-ink-faint">Fermé</p>
              ) : (
                <ul className="flex flex-1 flex-col gap-1">
                  {dayRules.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 text-sm text-ink-soft">
                      <span>
                        <span className="font-semibold text-ink">
                          {r.startTime} – {r.endTime}
                        </span>{" "}
                        <span className="text-ink-faint">(séances de {formatDuration(r.slotDurationMinutes)})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting === r.id}
                        aria-label={`Supprimer ${day.label} ${r.startTime}–${r.endTime}`}
                        className="text-xs font-semibold text-danger hover:underline disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
