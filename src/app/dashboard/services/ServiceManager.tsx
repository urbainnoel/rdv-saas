"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  priceLabel: string | null;
};

type Draft = { name: string; description: string; durationMinutes: string; priceLabel: string };

const EMPTY: Draft = { name: "", description: "", durationMinutes: "", priceLabel: "" };

function toDraft(s: Service): Draft {
  return {
    name: s.name,
    description: s.description ?? "",
    durationMinutes: s.durationMinutes ? String(s.durationMinutes) : "",
    priceLabel: s.priceLabel ?? "",
  };
}

// Champs vides envoyés tels quels : le serveur les enregistre comme « non renseigné ».
function toBody(d: Draft) {
  return {
    name: d.name,
    description: d.description,
    durationMinutes: d.durationMinutes,
    priceLabel: d.priceLabel,
  };
}

async function send(url: string, method: string, body?: unknown): Promise<string | null> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => null);
  if (res?.ok) return null;
  const data = await res?.json().catch(() => null);
  return data?.error ?? "Enregistrement impossible. Vérifie ta connexion et réessaie.";
}

export default function ServiceManager({ services }: { services: Service[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const err = await send("/api/dashboard/services", "POST", toBody(draft));
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setDraft(EMPTY);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await send(`/api/dashboard/services/${id}`, "DELETE");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Services</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Définis les services que tes clients peuvent choisir au moment de réserver (ex&nbsp;:
          «&nbsp;Consultation 30 min&nbsp;», «&nbsp;Suivi mensuel&nbsp;»). Si tu n&apos;ajoutes aucun service, tes
          clients réserveront simplement un créneau.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
        <h2 className="font-bold text-ink">Ajouter un service</h2>
        <ServiceFields idPrefix="new" draft={draft} onChange={setDraft} />
        {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 self-start rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          {submitting ? "Ajout…" : "Ajouter"}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {services.length === 0 ? (
          <p className="text-ink-soft">
            Aucun service défini pour l&apos;instant — ajoutes-en un ci-dessus, ou laisse vide si tu préfères que
            tes clients réservent simplement un créneau libre.
          </p>
        ) : (
          services.map((s) =>
            editingId === s.id ? (
              <EditService key={s.id} service={s} onDone={() => setEditingId(null)} />
            ) : (
              <div key={s.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold break-words text-ink">{s.name}</p>
                  <ServiceMeta service={s} />
                  {s.description && <p className="mt-1 text-sm break-words text-ink-soft">{s.description}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(s.id)}
                    className="min-h-11 rounded-xl border-2 border-border bg-surface px-3.5 text-sm font-bold text-ink transition hover:border-forest hover:text-forest"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    className="min-h-11 rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger-soft"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

function ServiceMeta({ service }: { service: Service }) {
  if (!service.durationMinutes && !service.priceLabel) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
      {service.durationMinutes && <span className="text-ink-soft">{service.durationMinutes} min</span>}
      {service.priceLabel && (
        // Espaces insécables entre chiffres : « 150 000 » reste sur une ligne.
        <span className="font-semibold break-words text-forest">{service.priceLabel.replace(/(\d) (?=\d)/g, "$1\u00a0")}</span>
      )}
    </p>
  );
}

function EditService({ service, onDone }: { service: Service; onDone: () => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(service));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const err = await send(`/api/dashboard/services/${service.id}`, "PATCH", toBody(draft));
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 rounded-2xl border-2 border-forest bg-surface p-4">
      <ServiceFields idPrefix={service.id} draft={draft} onChange={setDraft} />
      {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="min-h-11 rounded-xl border-2 border-border bg-surface px-4 text-sm font-bold text-ink transition hover:border-ink-faint"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "mt-1 w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-faint focus:border-forest sm:text-sm";

function ServiceFields({
  idPrefix,
  draft,
  onChange,
}: {
  idPrefix: string;
  draft: Draft;
  onChange: (d: Draft) => void;
}) {
  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...draft, [key]: e.target.value });

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label htmlFor={`${idPrefix}-name`} className="block text-xs font-medium text-ink-soft">
          Nom du service
        </label>
        <input
          id={`${idPrefix}-name`}
          required
          maxLength={100}
          type="text"
          value={draft.name}
          onChange={set("name")}
          placeholder="Ex : Consultation 30 min"
          className={inputClass}
        />
      </div>
      <div className="col-span-2">
        <label htmlFor={`${idPrefix}-description`} className="block text-xs font-medium text-ink-soft">
          Description (facultatif)
        </label>
        <input
          id={`${idPrefix}-description`}
          maxLength={500}
          type="text"
          value={draft.description}
          onChange={set("description")}
          placeholder="Ex : Bilan initial + plan d'action"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-duration`} className="block text-xs font-medium text-ink-soft">
          Durée (min)
        </label>
        <input
          id={`${idPrefix}-duration`}
          type="number"
          inputMode="numeric"
          min={5}
          max={720}
          step={5}
          value={draft.durationMinutes}
          onChange={set("durationMinutes")}
          placeholder="30"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-price`} className="block text-xs font-medium text-ink-soft">
          Prix (facultatif)
        </label>
        <input
          id={`${idPrefix}-price`}
          type="text"
          maxLength={60}
          value={draft.priceLabel}
          onChange={set("priceLabel")}
          placeholder="Ex : 150 000 GNF"
          className={inputClass}
        />
      </div>
    </div>
  );
}
