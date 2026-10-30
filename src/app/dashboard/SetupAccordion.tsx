"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuickAvailability from "@/components/QuickAvailability";
import { CheckIcon } from "@/components/icons";
import ShareLink from "./ShareLink";

// Mise en route d'un nouveau compte : trois lignes courtes. Un clic déplie
// une configuration rapide sur place (une étape ouverte à la fois), sans
// quitter l'accueil.

type StepId = "hours" | "activity" | "share";

export default function SetupAccordion({
  hasAvailability,
  hasKnowledge,
  slug,
  businessName,
}: {
  hasAvailability: boolean;
  hasKnowledge: boolean;
  slug: string;
  businessName: string;
}) {
  const [open, setOpen] = useState<StepId | null>(null);
  const toggle = (id: StepId) => setOpen((cur) => (cur === id ? null : id));

  return (
    <section className="rounded-3xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="px-1 text-lg font-extrabold text-ink">Mise en route</h2>
      <ol className="mt-3 flex flex-col gap-2">
        <Step n={1} id="hours" title="Indique tes horaires" done={hasAvailability} open={open} onToggle={toggle}>
          <QuickAvailability onSaved={() => setOpen("activity")} />
        </Step>
        <Step n={2} id="activity" title="Présente ton activité" done={hasKnowledge} open={open} onToggle={toggle}>
          <QuickActivity onSaved={() => setOpen("share")} />
        </Step>
        <Step n={3} id="share" title="Partage ton lien de réservation" done={false} open={open} onToggle={toggle}>
          <p className="mb-3 text-sm text-ink-soft">
            Envoie-le à tes clients, ou mets-le dans ta bio Instagram ou ton statut WhatsApp.
          </p>
          <ShareLink slug={slug} businessName={businessName} />
        </Step>
      </ol>
    </section>
  );
}

function Step({
  n,
  id,
  title,
  done,
  open,
  onToggle,
  children,
}: {
  n: number;
  id: StepId;
  title: string;
  done: boolean;
  open: StepId | null;
  onToggle: (id: StepId) => void;
  children: React.ReactNode;
}) {
  const isOpen = open === id;
  return (
    <li className={`rounded-2xl transition ${isOpen ? "bg-paper" : "bg-paper/60"}`}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        aria-controls={`setup-${id}`}
        className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left"
      >
        {done ? (
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-forest text-white">
            <CheckIcon className="h-4 w-4" />
          </span>
        ) : (
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 border-border bg-surface text-sm font-extrabold text-ink-soft">
            {n}
          </span>
        )}
        <span className={`flex-1 font-bold ${done ? "text-ink-faint" : "text-ink"}`}>{title}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`h-5 w-5 flex-none text-ink-faint transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div id={`setup-${id}`} className="px-3 pb-4 pt-1">
          {children}
        </div>
      )}
    </li>
  );
}

// ——— Étape 2 : présentation rapide de l'activité ———
// Quelques questions simples, enregistrées comme fiches « info » dans la
// bibliothèque de l'assistant (modifiables ensuite dans la bibliothèque).

const PAYMENTS = ["Espèces", "Orange Money", "MTN MoMo", "Wave", "Carte bancaire", "Virement"];

function QuickActivity({ onSaved }: { onSaved?: () => void }) {
  const router = useRouter();
  const [summary, setSummary] = useState("");
  const [prices, setPrices] = useState("");
  const [place, setPlace] = useState("");
  const [payments, setPayments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const entries = [
      { question: "Présentation de l'activité", answer: summary.trim() },
      { question: "Tarifs", answer: prices.trim() },
      { question: "Lieu des séances", answer: place.trim() },
      { question: "Moyens de paiement acceptés", answer: payments.join(", ") },
    ].filter((e) => e.answer);

    for (const entry of entries) {
      const res = await fetch("/api/dashboard/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entry, type: "info" }),
      }).catch(() => null);
      if (!res?.ok) {
        setSaving(false);
        setError("Enregistrement impossible pour le moment. Réessaie.");
        return;
      }
    }
    setSaving(false);
    onSaved?.();
    router.refresh();
  }

  const input =
    "mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-ink placeholder:text-ink-faint focus:border-forest";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">Ton assistant s&apos;en sert pour répondre à tes clients.</p>
      <label className="block text-sm font-bold text-ink">
        En une phrase, que proposes-tu&nbsp;?
        <textarea
          rows={2}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Ex : Coaching sportif pour se remettre en forme."
          className={`${input} font-normal`}
        />
      </label>
      <label className="block text-sm font-bold text-ink">
        Tes tarifs
        <input
          value={prices}
          onChange={(e) => setPrices(e.target.value)}
          placeholder="Ex : 150 000 GNF la séance"
          className={`${input} font-normal`}
        />
      </label>
      <label className="block text-sm font-bold text-ink">
        Où se passent les séances&nbsp;?
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Ex : Kaloum, ou en ligne"
          className={`${input} font-normal`}
        />
      </label>
      <fieldset>
        <legend className="text-sm font-bold text-ink">Moyens de paiement acceptés</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PAYMENTS.map((p) => {
            const on = payments.includes(p);
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => setPayments((cur) => (on ? cur.filter((x) => x !== p) : [...cur, p]))}
                className={`min-h-11 rounded-xl px-3.5 text-sm font-bold transition ${
                  on ? "bg-forest text-white" : "border-2 border-border bg-surface text-ink hover:border-forest"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </fieldset>
      {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving || !summary.trim()}
        className="rounded-xl bg-forest px-4 py-3 font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}
