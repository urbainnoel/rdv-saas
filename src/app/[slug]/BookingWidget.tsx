"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckIcon } from "@/components/icons";

type Slot = { startAt: string; endAt: string };
type SlotsByDay = Record<string, Slot[]>;
type Service = { id: string; name: string; description: string | null; durationMinutes: number | null };

export default function BookingWidget({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [services, setServices] = useState<Service[]>([]);
  const [slotsByDay, setSlotsByDay] = useState<SlotsByDay>({});
  // Fuseau de l'entrepreneur : tous les horaires s'affichent dans ce fuseau.
  const [timezone, setTimezone] = useState<string>("Africa/Conakry");
  const [visitorTimezone, setVisitorTimezone] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/slots?slug=${encodeURIComponent(slug)}&days=14`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
        return res.json();
      })
      .then((data) => {
        setBusinessName(data.entrepreneur.businessName);
        setServices(data.services ?? []);
        setSlotsByDay(data.slotsByDay);
        if (data.timezone) setTimezone(data.timezone);
        setVisitorTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone ?? null);
        const firstDay = Object.keys(data.slotsByDay)[0];
        setSelectedDay(firstDay ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const availableDays = useMemo(() => Object.keys(slotsByDay).sort(), [slotsByDay]);
  const needsServiceStep = services.length > 0;
  const serviceStepDone = !needsServiceStep || selectedServiceId !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
          serviceId: selectedServiceId || undefined,
          notes: notes || undefined,
          client: { fullName, email: email || undefined, phone: phone || undefined },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la réservation.");
      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-ink-soft">Chargement des créneaux disponibles…</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (success && selectedSlot) {
    const d = new Date(selectedSlot.startAt);
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-forest-soft p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-white">
          <CheckIcon className="h-5 w-5" />
        </div>
        <p className="font-display text-xl italic text-ink">Rendez-vous confirmé</p>
        <p className="text-ink-soft">
          Le {d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: timezone })} à{" "}
          {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: timezone })}
        </p>
        <p className="text-sm text-ink-faint">
          Vous recevrez une confirmation et un rappel avant le rendez-vous.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl italic text-ink">{businessName}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {!serviceStepDone ? "Que souhaitez-vous réserver ?" : "Choisissez un créneau disponible"}
      </p>

      {/* Étape 1 (si des services existent) : choix du service */}
      {needsServiceStep && !serviceStepDone && (
        <div className="mt-6 space-y-2">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedServiceId(s.id)}
              className="flex w-full items-start justify-between rounded-xl border border-border bg-surface p-4 text-left transition hover:border-forest"
            >
              <div>
                <p className="font-medium text-ink">{s.name}</p>
                {s.description && <p className="mt-0.5 text-sm text-ink-soft">{s.description}</p>}
              </div>
              {s.durationMinutes && (
                <span className="shrink-0 text-xs text-ink-faint">{s.durationMinutes} min</span>
              )}
            </button>
          ))}
        </div>
      )}

      {serviceStepDone && (
        <>
          {needsServiceStep && (
            <button
              onClick={() => {
                setSelectedServiceId(null);
                setSelectedSlot(null);
              }}
              className="mt-3 text-sm text-forest underline"
            >
              {services.find((s) => s.id === selectedServiceId)?.name} — changer
            </button>
          )}

          {availableDays.length === 0 ? (
            <p className="mt-6 text-ink-soft">
              Aucun créneau disponible pour le moment. Revenez plus tard !
            </p>
          ) : (
            <>
              {/* Sélecteur de jour */}
              <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
                {availableDays.map((day) => {
                  const d = new Date(day + "T12:00:00Z");
                  const isSelected = day === selectedDay;
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDay(day);
                        setSelectedSlot(null);
                      }}
                      className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "border-forest bg-forest text-white"
                          : "border-border bg-surface text-ink-soft hover:border-forest"
                      }`}
                    >
                      {d.toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        timeZone: "UTC",
                      })}
                    </button>
                  );
                })}
              </div>

              {/* Visiteur dans un autre fuseau : on précise l'heure de référence. */}
              {visitorTimezone && visitorTimezone !== timezone && (
                <p className="mt-3 text-xs text-ink-faint">
                  Horaires à l&apos;heure locale de {businessName} ({timezone.split("/").pop()?.replace(/_/g, " ")}).
                </p>
              )}

              {/* Sélecteur de créneau horaire */}
              {selectedDay && (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slotsByDay[selectedDay].map((slot) => {
                    const d = new Date(slot.startAt);
                    const isSelected = selectedSlot?.startAt === slot.startAt;
                    return (
                      <button
                        key={slot.startAt}
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          isSelected
                            ? "border-forest bg-forest text-white"
                            : "border-border bg-surface text-ink-soft hover:border-forest"
                        }`}
                      >
                        {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: timezone })}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Formulaire client */}
              {selectedSlot && (
                <form onSubmit={handleSubmit} className="mt-8 space-y-4 border-t border-border pt-6">
                  <h2 className="font-medium text-ink">Vos informations</h2>
                  <div>
                    <label className="block text-sm font-medium text-ink">Nom complet</label>
                    <input
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-ink placeholder:text-ink-faint focus:border-forest"
                      placeholder="Ex: Fatoumata Diallo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink">
                      Téléphone (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-ink placeholder:text-ink-faint focus:border-forest"
                      placeholder="+224 6XX XX XX XX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink">
                      Email (optionnel)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-ink placeholder:text-ink-faint focus:border-forest"
                      placeholder="vous@exemple.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink">
                      Un détail à préciser ? (optionnel)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-ink placeholder:text-ink-faint focus:border-forest"
                      placeholder="Ex: première séance, j'ai une douleur au genou droit"
                    />
                    <p className="mt-1 text-xs text-ink-faint">
                      Cette note sera visible par {businessName || "le professionnel"} pour préparer votre rendez-vous.
                    </p>
                  </div>

                  {submitError && (
                    <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                      {submitError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !fullName || (!email && !phone)}
                    className="w-full rounded-lg bg-amber px-4 py-2.5 font-medium text-ink transition hover:bg-amber-dark hover:text-white disabled:opacity-50"
                  >
                    {submitting ? "Réservation en cours…" : "Confirmer le rendez-vous"}
                  </button>
                </form>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
