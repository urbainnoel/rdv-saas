"use client";

import { useState } from "react";
import { COMMON_TIMEZONES } from "@/lib/timezone";

export default function TimezoneForm({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Le fuseau enregistré n'est pas dans la liste courte : on l'ajoute.
  const options = COMMON_TIMEZONES.some((t) => t.value === initialValue)
    ? COMMON_TIMEZONES
    : [{ value: initialValue, label: initialValue.replace(/_/g, " ") }, ...COMMON_TIMEZONES];

  const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: value });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/dashboard/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: value }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      setError(data?.error ?? "Enregistrement impossible.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="mt-4 space-y-3 rounded-xl border border-border bg-surface p-4">
      <div>
        <label className="block text-xs font-medium text-ink-soft">Fuseau horaire</label>
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-forest"
        >
          {options.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink-faint">Il est actuellement {now} dans ce fuseau.</p>
      </div>
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-forest px-4 py-1.5 text-sm font-medium text-white transition hover:bg-forest-dark disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : saved ? "Enregistré" : "Enregistrer"}
      </button>
    </form>
  );
}
