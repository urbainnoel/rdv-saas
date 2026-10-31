"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, CheckIcon, ClockIcon, TagIcon } from "@/components/icons";
import { formatDateFr, formatTimeFr } from "@/lib/timezone";
import type { ManageBlockReason } from "../manage";

type Slot = { startAt: string; endAt: string };
type View = "summary" | "confirmCancel" | "reschedule" | "cancelled" | "rescheduled";

class BlockedError extends Error {}

const BLOCK_MESSAGES: Record<ManageBlockReason, string> = {
  cancelled: "Ce rendez-vous est annulé.",
  past: "Ce rendez-vous est passé : il ne peut plus être modifié.",
  too_late: "Votre rendez-vous commence dans moins de 2 heures : il ne peut plus être annulé ni déplacé en ligne.",
};

export default function ManageAppointment({
  token,
  slug,
  businessName,
  logoUrl,
  timezone,
  firstName,
  serviceName,
  dateLabel: initialDate,
  timeLabel: initialTime,
  blockReason: initialBlock,
}: {
  token: string;
  slug: string;
  businessName: string;
  logoUrl: string | null;
  timezone: string;
  firstName: string;
  serviceName: string | null;
  dateLabel: string;
  timeLabel: string;
  blockReason: ManageBlockReason | null;
}) {
  const [view, setView] = useState<View>("summary");
  const [dateLabel, setDateLabel] = useState(initialDate);
  const [timeLabel, setTimeLabel] = useState(initialTime);
  const [blockReason, setBlockReason] = useState(initialBlock);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slotsByDay, setSlotsByDay] = useState<Record<string, Slot[]> | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const days = useMemo(() => Object.keys(slotsByDay ?? {}).sort(), [slotsByDay]);

  async function post(payload: object) {
    const res = await fetch(`/api/public/manage/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // RDV devenu non modifiable entre-temps : on bascule sur le message
      // adapté (qui remplace alors le message d'erreur).
      if (data.reason) {
        setBlockReason(data.reason);
        throw new BlockedError();
      }
      throw new Error(data.error ?? "Une erreur est survenue. Réessayez.");
    }
    return data as { startAt: string; endAt: string };
  }

  async function handleCancel() {
    setBusy(true);
    setError(null);
    try {
      await post({ action: "cancel" });
      setView("cancelled");
    } catch (err) {
      if (!(err instanceof BlockedError)) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function loadSlots() {
    const res = await fetch(`/api/public/manage/${encodeURIComponent(token)}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Impossible de charger les créneaux.");
    const byDay: Record<string, Slot[]> = data.slotsByDay ?? {};
    setSlotsByDay(byDay);
    setSelectedSlot(null);
    setSelectedDay((current) => (current && byDay[current] ? current : (Object.keys(byDay).sort()[0] ?? null)));
  }

  async function openReschedule() {
    setView("reschedule");
    setError(null);
    setBusy(true);
    try {
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les créneaux.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReschedule() {
    if (!selectedSlot) return;
    setBusy(true);
    setError(null);
    try {
      const data = await post({ action: "reschedule", ...selectedSlot });
      const start = new Date(data.startAt);
      setDateLabel(formatDateFr(start, timezone));
      setTimeLabel(`${formatTimeFr(start, timezone)} – ${formatTimeFr(new Date(data.endAt), timezone)}`);
      setView("rescheduled");
    } catch (err) {
      if (err instanceof BlockedError) return;
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      // Le créneau a pu être pris : on recharge la liste pour ne plus le proposer.
      loadSlots().catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  const cancelled = view === "cancelled" || blockReason === "cancelled";

  return (
    <div className="animate-rise">
      <div className="flex items-center gap-3">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-border object-contain" />
        )}
        <p className="min-w-0 font-display text-lg font-extrabold tracking-tight text-ink">{businessName}</p>
      </div>

      <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {view === "cancelled"
          ? "Rendez-vous annulé"
          : view === "rescheduled"
            ? "Rendez-vous déplacé"
            : `Bonjour ${firstName}`}
      </h1>
      <p className="mt-1 text-ink-soft">
        {view === "cancelled"
          ? `${businessName} a été prévenu. Vous pouvez reprendre un créneau quand vous le souhaitez.`
          : view === "rescheduled"
            ? `C'est noté, ${businessName} a été prévenu. Voici votre nouvel horaire.`
            : "Voici votre rendez-vous."}
      </p>

      {/* Récapitulatif */}
      <dl
        className={`mt-5 space-y-3 rounded-2xl border p-4 ${
          view === "rescheduled" ? "border-forest bg-forest-soft" : "border-border bg-paper"
        } ${cancelled ? "opacity-60" : ""}`}
      >
        {serviceName && (
          <Row icon={<TagIcon className="h-5 w-5" />} label="Service">
            {serviceName}
          </Row>
        )}
        <Row icon={<CalendarIcon className="h-5 w-5" />} label="Date">
          <span className={`inline-block first-letter:uppercase ${cancelled ? "line-through" : ""}`}>{dateLabel}</span>
        </Row>
        <Row icon={<ClockIcon className="h-5 w-5" />} label="Heure">
          <span className={cancelled ? "line-through" : ""}>{timeLabel}</span>
        </Row>
      </dl>

      {error && <p className="mt-4 rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger">{error}</p>}

      {/* RDV non modifiable : on oriente vers l'entrepreneur. */}
      {blockReason && view !== "cancelled" && view !== "rescheduled" ? (
        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <p className="font-medium text-ink">{BLOCK_MESSAGES[blockReason]}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {blockReason === "too_late"
              ? `Pour tout changement, contactez directement ${businessName}.`
              : `Pour un nouveau rendez-vous ou une question, contactez ${businessName}.`}
          </p>
          <a
            href={`/${slug}`}
            className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-forest px-4 py-3 text-center font-bold text-white transition hover:bg-forest-dark"
          >
            {blockReason === "too_late" ? "Contacter le professionnel" : "Reprendre un rendez-vous"}
          </a>
        </div>
      ) : view === "cancelled" ? (
        <a
          href={`/${slug}`}
          className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-forest px-4 py-3 text-center font-bold text-white transition hover:bg-forest-dark"
        >
          Reprendre un rendez-vous
        </a>
      ) : view === "rescheduled" ? (
        <p className="mt-5 flex items-center gap-2 text-sm text-ink-soft">
          <CheckIcon className="h-4 w-4 text-forest" />
          Gardez cette page : elle reste valable pour votre nouvel horaire.
        </p>
      ) : view === "confirmCancel" ? (
        <div className="mt-5 rounded-2xl border border-danger/30 bg-danger-soft p-4">
          <p className="font-medium text-ink">Annuler ce rendez-vous&nbsp;?</p>
          <p className="mt-1 text-sm text-ink-soft">Le créneau sera libéré pour d&apos;autres personnes.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleCancel}
              disabled={busy}
              className="min-h-11 flex-1 rounded-xl bg-danger px-4 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Annulation…" : "Oui, annuler"}
            </button>
            <button
              onClick={() => setView("summary")}
              disabled={busy}
              className="min-h-11 flex-1 rounded-xl border-2 border-border bg-surface px-4 py-3 font-bold text-ink transition hover:border-ink-faint"
            >
              Non, garder
            </button>
          </div>
        </div>
      ) : view === "reschedule" ? (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">Choisir un autre créneau</h2>
            <button
              onClick={() => {
                setView("summary");
                setError(null);
              }}
              className="min-h-11 shrink-0 px-2 text-sm text-ink-soft underline hover:text-ink"
            >
              Retour
            </button>
          </div>

          {busy && !slotsByDay ? (
            <p className="mt-3 text-sm text-ink-soft">Chargement des créneaux…</p>
          ) : days.length === 0 ? (
            slotsByDay && (
              <p className="mt-3 rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-ink-soft">
                Aucun autre créneau libre dans les 3 prochaines semaines. Contactez {businessName} pour trouver une
                solution.
              </p>
            )
          ) : (
            <>
              <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-2">
                {days.map((day) => {
                  const isSelected = day === selectedDay;
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDay(day);
                        setSelectedSlot(null);
                      }}
                      className={`min-h-11 shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        isSelected
                          ? "border-forest bg-forest text-white"
                          : "border-border bg-surface text-ink-soft hover:border-forest"
                      }`}
                    >
                      {new Date(day + "T12:00:00Z").toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        timeZone: "UTC",
                      })}
                    </button>
                  );
                })}
              </div>

              {selectedDay && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {(slotsByDay?.[selectedDay] ?? []).map((slot) => {
                    const isSelected = selectedSlot?.startAt === slot.startAt;
                    return (
                      <button
                        key={slot.startAt}
                        onClick={() => setSelectedSlot(slot)}
                        className={`min-h-11 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                          isSelected
                            ? "border-forest bg-forest text-white"
                            : "border-border bg-surface text-ink-soft hover:border-forest"
                        }`}
                      >
                        {formatTimeFr(new Date(slot.startAt), timezone)}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={handleReschedule}
                disabled={!selectedSlot || busy}
                className="mt-5 min-h-11 w-full rounded-xl bg-forest px-4 py-3 font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
              >
                {busy && selectedSlot
                  ? "Enregistrement…"
                  : selectedSlot
                    ? `Déplacer au ${formatDateFr(new Date(selectedSlot.startAt), timezone)} à ${formatTimeFr(
                        new Date(selectedSlot.startAt),
                        timezone
                      )}`
                    : "Sélectionnez un créneau"}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={openReschedule}
            className="min-h-11 w-full rounded-xl bg-forest px-4 py-3 font-bold text-white transition hover:bg-forest-dark"
          >
            Choisir un autre créneau
          </button>
          <button
            onClick={() => {
              setView("confirmCancel");
              setError(null);
            }}
            className="min-h-11 w-full rounded-xl border-2 border-border bg-surface px-4 py-3 font-bold text-danger transition hover:border-danger/40"
          >
            Annuler mon rendez-vous
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-ink-faint">
        Horaires à l&apos;heure locale de {businessName} ({timezone.split("/").pop()?.replace(/_/g, " ")}).
      </p>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-forest">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</dt>
        <dd className="font-medium text-ink">{children}</dd>
      </div>
    </div>
  );
}
