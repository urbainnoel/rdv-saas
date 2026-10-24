"use client";

import { useEffect, useMemo, useState } from "react";

type Slot = { startAt: string; endAt: string };
type SlotsByDay = Record<string, Slot[]>;

export default function BookingWidget({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [slotsByDay, setSlotsByDay] = useState<SlotsByDay>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
        setSlotsByDay(data.slotsByDay);
        const firstDay = Object.keys(data.slotsByDay)[0];
        setSelectedDay(firstDay ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const availableDays = useMemo(() => Object.keys(slotsByDay).sort(), [slotsByDay]);

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
    return <p className="text-neutral-500">Chargement des créneaux disponibles…</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (success && selectedSlot) {
    const d = new Date(selectedSlot.startAt);
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-lg font-semibold text-green-800">Rendez-vous confirmé ✅</p>
        <p className="mt-2 text-green-700">
          Le {d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à{" "}
          {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="mt-2 text-sm text-green-600">
          Vous recevrez une confirmation et un rappel avant le rendez-vous.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{businessName}</h1>
      <p className="mt-1 text-neutral-500">Choisissez un créneau disponible</p>

      {availableDays.length === 0 ? (
        <p className="mt-6 text-neutral-500">
          Aucun créneau disponible pour le moment. Revenez plus tard !
        </p>
      ) : (
        <>
          {/* Sélecteur de jour */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {availableDays.map((day) => {
              const d = new Date(day + "T00:00:00");
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
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                </button>
              );
            })}
          </div>

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
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                    }`}
                  >
                    {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </button>
                );
              })}
            </div>
          )}

          {/* Formulaire client */}
          {selectedSlot && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4 border-t border-neutral-200 pt-6">
              <h2 className="font-semibold">Vos informations</h2>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Nom complet</label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="Ex: Fatoumata Diallo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Téléphone (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="+224 6XX XX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="vous@exemple.com"
                />
              </div>

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}

              <button
                type="submit"
                disabled={submitting || !fullName || (!email && !phone)}
                className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
              >
                {submitting ? "Réservation en cours…" : "Confirmer le rendez-vous"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
