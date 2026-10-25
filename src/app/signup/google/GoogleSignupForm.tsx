"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";

export default function GoogleSignupForm({ email }: { email: string }) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/google/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res?.ok) {
      setError(data?.error ?? "Impossible de créer le compte pour le moment.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-8">
        <BrandMark />
      </div>
      <h1 className="font-display text-2xl italic text-ink">Dernière étape</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Connecté avec <span className="font-medium text-ink">{email}</span>. Comment s&apos;appelle ton
        activité ?
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink">Nom de ton activité</label>
          <input
            required
            autoFocus
            minLength={2}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Ex: Fatou Coach Sportif"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-ink placeholder:text-ink-faint focus:border-forest"
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            Il apparaît sur ta page de réservation et dans ton lien public.
          </p>
        </div>

        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-forest px-4 py-2.5 font-medium text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>
    </main>
  );
}
