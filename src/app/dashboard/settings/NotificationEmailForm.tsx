"use client";

import { useState } from "react";

export default function NotificationEmailForm({
  accountEmail,
  initialValue,
}: {
  accountEmail: string;
  initialValue: string | null;
}) {
  const [value, setValue] = useState(initialValue ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationEmail: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-4 space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div>
        <label className="block text-xs font-medium text-ink-soft">Email de notification</label>
        <input
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={accountEmail}
          className="mt-1 w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-forest"
        />
        <p className="mt-1 text-xs text-ink-faint">
          Laisse vide pour utiliser ton email de connexion ({accountEmail}).
        </p>
      </div>
      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-forest px-4 py-1.5 text-sm font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : saved ? "Enregistré" : "Enregistrer"}
      </button>
    </form>
  );
}
