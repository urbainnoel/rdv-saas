"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number | null;
};

export default function ServiceManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/dashboard/services");
    const data = await res.json();
    setServices(data.services ?? []);
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
      const res = await fetch("/api/dashboard/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          durationMinutes: durationMinutes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setName("");
      setDescription("");
      setDurationMinutes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/dashboard/services/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl italic text-ink">Services</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Définis les services que tes clients peuvent choisir au moment de
        réserver (ex: &quot;Consultation 30 min&quot;, &quot;Suivi mensuel&quot;). Si tu n&apos;ajoutes
        aucun service, tes clients réserveront simplement un créneau.
      </p>

      <form
        onSubmit={handleAdd}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4"
      >
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-ink-soft">Nom du service</label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Consultation 30 min"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink focus:border-forest"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-ink-soft">
            Description (optionnel)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Bilan initial + plan d'action"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink focus:border-forest"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-soft">Durée (min)</label>
          <input
            type="number"
            min={5}
            step={5}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="30"
            className="mt-1 w-24 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink focus:border-forest"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-forest px-4 py-1.5 text-sm font-medium text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>
      {error && (
        <p className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {!loading && (
        <div className="mt-6 space-y-2">
          {services.length === 0 ? (
            <p className="text-ink-soft">
              Aucun service défini pour l&apos;instant — ajoutes-en un ci-dessus, ou laisse vide
              si tu préfères que tes clients réservent simplement un créneau libre.
            </p>
          ) : (
            services.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between rounded-xl border border-border bg-surface p-4"
              >
                <div>
                  <p className="font-medium text-ink">
                    {s.name}
                    {s.durationMinutes && (
                      <span className="ml-2 text-xs font-normal text-ink-faint">
                        {s.durationMinutes} min
                      </span>
                    )}
                  </p>
                  {s.description && (
                    <p className="mt-1 text-sm text-ink-soft">{s.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="shrink-0 text-xs text-danger hover:underline"
                >
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
