"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/icons";

export type AbsenceItem = { id: string; label: string; reason: string | null };
type Conflict = { id: string; clientName: string; label: string };

const FIELD =
  "mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 font-normal text-ink focus:border-forest";
const LABEL = "block text-sm font-bold text-ink";

// Absences (congés, formation, rendez-vous perso…) : pendant ces périodes,
// plus aucun créneau n'est proposé. Les RDV déjà pris restent prévus.
export default function AbsencesManager({
  absences,
  todayKey,
  initiallyOpen = false,
  initialConflicts = null,
}: {
  absences: AbsenceItem[];
  todayKey: string;
  initiallyOpen?: boolean;
  initialConflicts?: Conflict[] | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initiallyOpen);
  const [startDate, setStartDate] = useState(todayKey);
  const [endDate, setEndDate] = useState(todayKey);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[] | null>(initialConflicts);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function changeStart(value: string) {
    setStartDate(value);
    // La fin suit le début tant qu'elle serait avant lui.
    if (endDate < value) setEndDate(value);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/dashboard/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, allDay, startTime, endTime, reason }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      setError(data?.error ?? "Impossible d'enregistrer l'absence pour le moment.");
      return;
    }
    setConflicts(data?.conflicts ?? []);
    setReason("");
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    setDeleting(id);
    setDeleteError(null);
    const res = await fetch(`/api/dashboard/blocked-slots/${id}`, { method: "DELETE" }).catch(() => null);
    setDeleting(null);
    setConfirmDelete(null);
    if (!res?.ok) {
      setDeleteError("Impossible de supprimer cette absence pour le moment.");
      return;
    }
    router.refresh();
  }

  return (
    <section aria-labelledby="absences-title" className="flex flex-col gap-3">
      <div>
        <h2 id="absences-title" className="text-xl font-extrabold text-ink">
          Absences
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Congés, formation, imprévu… Pendant une absence, plus aucun créneau n&apos;est proposé à tes clients.
        </p>
      </div>

      {conflicts && conflicts.length === 0 && (
        <p role="status" className="rounded-xl bg-forest-soft px-3.5 py-2.5 text-sm font-semibold text-forest">
          Absence enregistrée. Aucun rendez-vous n&apos;était prévu pendant cette période.
        </p>
      )}
      {conflicts && conflicts.length > 0 && (
        <div role="status" className="rounded-2xl border-2 border-amber bg-amber-soft p-4">
          <p className="font-bold text-ink">
            Absence enregistrée.{" "}
            {conflicts.length === 1
              ? "1 rendez-vous reste prévu pendant cette absence"
              : `${conflicts.length} rendez-vous restent prévus pendant cette absence`}
            &nbsp;: pense à {conflicts.length === 1 ? "le" : "les"} reporter depuis l&apos;agenda.
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-ink-soft">
            {conflicts.map((c) => (
              <li key={c.id}>
                <span className="font-semibold text-ink">{c.clientName}</span> — {c.label}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/agenda"
            className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-forest px-4 font-bold text-white hover:bg-forest-dark"
          >
            Ouvrir l&apos;agenda
          </Link>
        </div>
      )}

      {open ? (
        <form onSubmit={save} className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <h3 className="text-lg font-extrabold text-ink">Nouvelle absence</h3>

          <div className="grid grid-cols-2 gap-3">
            <label className={LABEL}>
              Du
              <input
                type="date"
                required
                min={todayKey}
                value={startDate}
                onChange={(e) => changeStart(e.target.value)}
                className={FIELD}
              />
            </label>
            <label className={LABEL}>
              Au
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={FIELD}
              />
            </label>
          </div>

          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-5 w-5 accent-forest"
            />
            Journées entières
          </label>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <label className={LABEL}>
                À partir de
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={FIELD}
                />
                <span className="mt-1 block text-xs font-normal text-ink-faint">le premier jour</span>
              </label>
              <label className={LABEL}>
                Jusqu&apos;à
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={FIELD}
                />
                <span className="mt-1 block text-xs font-normal text-ink-faint">le dernier jour</span>
              </label>
            </div>
          )}

          <label className={LABEL}>
            Motif <span className="font-normal text-ink-faint">(facultatif, visible par toi seul)</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="Ex.&nbsp;: congés, formation"
              className={FIELD}
            />
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
              {saving ? "Enregistrement…" : "Enregistrer l'absence"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="min-h-12 rounded-xl border-2 border-border bg-surface px-4 py-3 font-bold text-ink-soft"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setConflicts(null);
            setOpen(true);
          }}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-border bg-surface px-4 py-3 font-bold text-ink transition hover:border-forest hover:text-forest sm:self-start"
        >
          <PlusIcon className="h-5 w-5" />
          Ajouter une absence
        </button>
      )}

      {deleteError && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{deleteError}</p>}

      {absences.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-5 text-sm text-ink-faint">
          Aucune absence prévue. Ajoute tes congés à l&apos;avance pour que personne ne réserve pendant ce temps.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {absences.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-bold text-ink">{a.label}</p>
                {a.reason && <p className="break-words text-sm text-ink-soft">{a.reason}</p>}
              </div>
              {confirmDelete === a.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink">Supprimer&nbsp;?</span>
                  <button
                    type="button"
                    disabled={deleting === a.id}
                    onClick={() => remove(a.id)}
                    className="min-h-11 rounded-xl bg-danger px-4 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {deleting === a.id ? "Suppression…" : "Oui"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    className="min-h-11 rounded-xl border-2 border-border bg-surface px-4 text-sm font-bold text-ink-soft"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(a.id)}
                  aria-label={`Supprimer l'absence : ${a.label}`}
                  className="min-h-11 self-start rounded-xl px-2 text-sm font-semibold text-danger hover:underline sm:self-auto"
                >
                  Supprimer
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
