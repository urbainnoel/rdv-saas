"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Suppression du compte : repliée par défaut, puis confirmation en retapant
// le nom de l'activité (pas de boîte de dialogue du navigateur).
export default function DeleteAccount({ businessName }: { businessName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clean = (s: string) => s.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");
  const matches = clean(typed) === clean(businessName);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!matches) return;
    setDeleting(true);
    setError(null);
    const res = await fetch("/api/dashboard/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: typed }),
    }).catch(() => null);
    if (res?.ok) {
      // La session n'existe plus : retour à l'accueil, sans garder le tableau de bord en cache.
      router.replace("/");
      router.refresh();
      return;
    }
    const data = await res?.json().catch(() => null);
    setDeleting(false);
    setError(data?.error ?? "Suppression impossible. Vérifie ta connexion et réessaie.");
  }

  function close() {
    setOpen(false);
    setTyped("");
    setError(null);
  }

  return (
    <div className="rounded-3xl border border-danger/40 bg-surface p-5">
      <h3 className="font-bold text-ink">Supprimer mon compte</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Ton compte et toutes ses données sont effacés définitivement&nbsp;: rendez-vous, clients, prospects,
        services, horaires, bibliothèque de l&apos;assistant. Ta page de réservation et l&apos;assistant installé
        sur ton site cessent de fonctionner.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 min-h-11 rounded-xl border-2 border-danger bg-surface px-4 py-2 text-sm font-bold text-danger transition hover:bg-danger-soft"
        >
          Supprimer mon compte
        </button>
      ) : (
        <form onSubmit={handleDelete} className="mt-4 flex flex-col gap-3 rounded-2xl bg-danger-soft p-4">
          <p className="text-sm font-bold text-danger">Cette action est irréversible.</p>
          <div>
            <label htmlFor="delete-confirm" className="block text-sm text-ink">
              Pour confirmer, tape le nom de ton activité&nbsp;: <span className="font-bold">{businessName}</span>
            </label>
            <input
              id="delete-confirm"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3.5 py-3 text-base text-ink focus:border-danger sm:text-sm"
            />
          </div>
          {error && <p className="rounded-xl bg-surface px-3 py-2 text-sm text-danger">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!matches || deleting}
              className="min-h-11 rounded-xl bg-danger px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {deleting ? "Suppression…" : "Supprimer définitivement"}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={deleting}
              className="min-h-11 rounded-xl border-2 border-border bg-surface px-4 py-2 text-sm font-bold text-ink transition hover:border-ink-faint"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
