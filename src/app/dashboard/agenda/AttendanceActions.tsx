"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Pointage d'un RDV passé : le client est venu ou non. Modifiable à tout moment
// pour corriger une erreur.
export default function AttendanceActions({
  appointmentId,
  status,
  clientName,
}: {
  appointmentId: string;
  status: string;
  clientName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"complete" | "no_show" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function mark(action: "complete" | "no_show") {
    setBusy(action);
    setError(null);
    const res = await fetch(`/api/dashboard/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      setError(data?.error ?? "Action impossible pour le moment.");
      return;
    }
    router.refresh();
  }

  const came = status === "COMPLETED";
  const missed = status === "NO_SHOW";
  const base =
    "min-h-11 flex-1 rounded-xl border-2 px-4 py-2 text-sm font-bold transition disabled:opacity-50 sm:flex-none";

  return (
    <div className="flex flex-col gap-1.5 sm:items-end">
      <div role="group" aria-label={`Présence de ${clientName}`} className="flex gap-2">
        <button
          type="button"
          aria-pressed={came}
          disabled={busy !== null}
          onClick={() => mark("complete")}
          className={`${base} ${
            came ? "border-forest bg-forest text-white" : "border-border bg-surface text-ink-soft hover:border-forest hover:text-forest"
          }`}
        >
          {busy === "complete" ? "…" : "Venu"}
        </button>
        <button
          type="button"
          aria-pressed={missed}
          disabled={busy !== null}
          onClick={() => mark("no_show")}
          className={`${base} ${
            missed ? "border-danger bg-danger text-white" : "border-border bg-surface text-ink-soft hover:border-danger hover:text-danger"
          }`}
        >
          {busy === "no_show" ? "…" : "Absent"}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
