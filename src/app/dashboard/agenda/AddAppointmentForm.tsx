"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";

export type ServiceOption = { id: string; name: string; durationMinutes: number | null };

const FIELD =
  "mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 font-normal text-ink focus:border-forest";
const LABEL = "block text-sm font-bold text-ink";

// Ajout d'un RDV à la main (client au téléphone ou sur place), dans la page.
// L'heure est celle de l'entrepreneur ; le serveur fait la conversion.
export default function AddAppointmentForm({
  services,
  minDate,
  defaultDate,
  defaultTime,
  initiallyOpen = false,
}: {
  services: ServiceOption[];
  minDate: string;
  defaultDate: string;
  defaultTime: string;
  initiallyOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initiallyOpen);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function chooseService(id: string) {
    setServiceId(id);
    const service = services.find((s) => s.id === id);
    // La durée suit celle du service ; 60 min par défaut s'il n'en a pas.
    setDuration(String(service?.durationMinutes ?? 60));
  }

  function reset() {
    setFullName("");
    setPhone("");
    setEmail("");
    setServiceId("");
    setDuration("60");
    setNotes("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError("Indique le nom du client.");
    if (!phone.trim() && !email.trim()) return setError("Indique au moins un téléphone ou un email.");

    setSaving(true);
    const res = await fetch("/api/dashboard/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        phone,
        email,
        serviceId: serviceId || null,
        date,
        time,
        durationMinutes: Number(duration),
        notes,
      }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      setError(data?.error ?? "Impossible d'ajouter le rendez-vous pour le moment.");
      return;
    }
    setSuccess(`Rendez-vous ajouté : ${fullName.trim()}, ${data?.label ?? ""}.`);
    reset();
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            setSuccess(null);
            setOpen(true);
          }}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3 font-bold text-ink transition hover:bg-amber-dark sm:self-start"
        >
          <PlusIcon className="h-5 w-5" />
          Ajouter un rendez-vous
        </button>
        {success && (
          <p role="status" className="rounded-xl bg-forest-soft px-3.5 py-2.5 text-sm font-semibold text-forest">
            {success}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      aria-labelledby="add-appointment-title"
      className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 sm:p-6"
    >
      <div>
        <h2 id="add-appointment-title" className="text-lg font-extrabold text-ink">
          Nouveau rendez-vous
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Pour un client qui t&apos;appelle ou passe te voir. Tu peux choisir une heure en dehors de tes horaires.
        </p>
      </div>

      <label className={LABEL}>
        Nom du client
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="off"
          className={FIELD}
        />
      </label>

      <fieldset>
        <legend className="text-sm font-bold text-ink">
          Contact <span className="font-normal text-ink-faint">(au moins l&apos;un des deux)</span>
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-ink-soft">
            Téléphone
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="off"
              className={FIELD}
            />
          </label>
          <label className="block text-sm font-semibold text-ink-soft">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              className={FIELD}
            />
          </label>
        </div>
      </fieldset>

      {services.length > 0 && (
        <label className={LABEL}>
          Service <span className="font-normal text-ink-faint">(facultatif)</span>
          <select value={serviceId} onChange={(e) => chooseService(e.target.value)} className={FIELD}>
            <option value="">Aucun en particulier</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.durationMinutes ? ` (${s.durationMinutes} min)` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className={`${LABEL} col-span-2 sm:col-span-1`}>
          Date
          <input
            type="date"
            required
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={FIELD}
          />
        </label>
        <label className={LABEL}>
          Heure
          <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={FIELD} />
        </label>
        <label className={LABEL}>
          Durée (min)
          <input
            type="number"
            required
            inputMode="numeric"
            min={5}
            max={720}
            step={5}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={FIELD}
          />
        </label>
      </div>

      <label className={LABEL}>
        Note <span className="font-normal text-ink-faint">(facultatif)</span>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={FIELD} />
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={saving}
          className="min-h-12 rounded-xl bg-forest px-4 py-3 font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer le rendez-vous"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="min-h-12 rounded-xl border-2 border-border bg-surface px-4 py-3 font-bold text-ink-soft"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
