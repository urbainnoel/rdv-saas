"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Slot = { startAt: string; endAt: string };

// Actions sur un RDV de l'agenda : reporter (choix d'un nouveau créneau libre)
// ou annuler (avec confirmation dans la page, sans boîte de dialogue).
export default function AppointmentActions({
  appointmentId,
  slug,
  clientName,
}: {
  appointmentId: string;
  slug: string;
  clientName: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "confirm-cancel" | "reschedule">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotsByDay, setSlotsByDay] = useState<Record<string, Slot[]> | null>(null);
  const [day, setDay] = useState<string | null>(null);

  async function send(body: object) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/dashboard/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setError(data?.error ?? "Action impossible pour le moment.");
      return;
    }
    setMode("idle");
    router.refresh();
  }

  async function openReschedule() {
    setMode("reschedule");
    setError(null);
    if (slotsByDay) return;
    const res = await fetch(`/api/slots?slug=${encodeURIComponent(slug)}&days=21`).catch(() => null);
    const data = await res?.json().catch(() => null);
    const byDay: Record<string, Slot[]> = data?.slotsByDay ?? {};
    setSlotsByDay(byDay);
    setDay(Object.keys(byDay).sort()[0] ?? null);
  }

  if (mode === "confirm-cancel") {
    return (
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <p className="text-sm text-ink">Annuler le RDV de {clientName.split(" ")[0]} ?</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => send({ action: "cancel" })}
            className="rounded-full bg-danger px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {busy ? "Annulation…" : "Oui, annuler"}
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft"
          >
            Non
          </button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  if (mode === "reschedule") {
    const days = slotsByDay ? Object.keys(slotsByDay).sort() : [];
    return (
      <div className="w-full rounded-lg bg-paper p-3 sm:w-80">
        <p className="text-sm font-medium text-ink">Nouveau créneau</p>
        {!slotsByDay ? (
          <p className="mt-2 text-xs text-ink-faint">Chargement des créneaux…</p>
        ) : days.length === 0 ? (
          <p className="mt-2 text-xs text-ink-faint">Aucun créneau libre sur les 3 prochaines semaines.</p>
        ) : (
          <>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDay(d)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    d === day ? "bg-forest text-white" : "bg-surface text-ink-soft"
                  }`}
                >
                  {new Date(`${d}T00:00:00Z`).toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  })}
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {day &&
                slotsByDay[day]?.map((slot) => (
                  <button
                    key={slot.startAt}
                    type="button"
                    disabled={busy}
                    onClick={() => send({ action: "reschedule", ...slot })}
                    className="rounded-md bg-surface px-1 py-1.5 text-xs text-ink transition hover:bg-forest hover:text-white disabled:opacity-50"
                  >
                    {new Date(slot.startAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </button>
                ))}
            </div>
          </>
        )}
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        <button
          type="button"
          onClick={() => setMode("idle")}
          className="mt-2 text-xs text-ink-faint underline"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={openReschedule}
        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-forest hover:text-forest"
      >
        Reporter
      </button>
      <button
        type="button"
        onClick={() => setMode("confirm-cancel")}
        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-danger hover:text-danger"
      >
        Annuler
      </button>
    </div>
  );
}
