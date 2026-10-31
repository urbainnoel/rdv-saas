"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { normalizeSlug, slugError, SLUG_MAX } from "@/lib/slug";

// Nom de l'activité + lien public (/<slug>), avec aperçu du lien en direct.
export default function BusinessForm({
  host,
  initialName,
  initialSlug,
}: {
  host: string;
  initialName: string;
  initialSlug: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  // Dernier lien enregistré : sert à savoir si l'avertissement doit s'afficher.
  const [savedSlug, setSavedSlug] = useState(initialSlug);
  const [savedName, setSavedName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizeSlug(slug);
  const slugChanged = normalized !== savedSlug;
  const liveError = slugChanged && normalized ? slugError(normalized) : null;
  const dirty = slugChanged || name.trim() !== savedName;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (liveError) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/dashboard/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName: name, slug: normalized }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      setError(data?.error ?? "Enregistrement impossible. Vérifie ta connexion et réessaie.");
      return;
    }
    setSavedSlug(data.slug);
    setSavedName(data.businessName);
    setSlug(data.slug);
    setName(data.businessName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    // Le menu et le bouton « copier mon lien » lisent le lien côté serveur.
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5">
      <div>
        <label htmlFor="business-name" className="block text-sm font-bold text-ink">
          Nom de l&apos;activité
        </label>
        <input
          id="business-name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3.5 py-3 text-base text-ink focus:border-forest sm:text-sm"
        />
        <p className="mt-1 text-xs text-ink-faint">Affiché en titre sur ta page de réservation et par l&apos;assistant.</p>
      </div>

      <div>
        <label htmlFor="business-slug" className="block text-sm font-bold text-ink">
          Lien de ta page
        </label>
        <div className="mt-1.5 flex items-stretch overflow-hidden rounded-2xl border border-border bg-surface focus-within:border-forest">
          <span className="flex shrink-0 items-center bg-paper px-3 text-sm text-ink-faint">/</span>
          <input
            id="business-slug"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            maxLength={SLUG_MAX}
            value={slug}
            // Minuscules et tirets à la volée : sur téléphone, le clavier met souvent une majuscule.
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            aria-describedby="slug-preview"
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-ink outline-none sm:text-sm"
          />
        </div>
        <p id="slug-preview" className="mt-1.5 text-sm text-ink-soft">
          Aperçu&nbsp;: <span className="break-all font-semibold text-ink">{host}/{normalized || "…"}</span>
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          Lettres minuscules sans accent, chiffres et tirets — 3 à {SLUG_MAX} caractères.
        </p>
        {liveError && <p className="mt-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{liveError}</p>}
      </div>

      {slugChanged && !liveError && normalized && (
        <div className="rounded-2xl border border-amber bg-amber-soft p-4 text-sm text-ink">
          <p className="font-bold">Attention, ton ancien lien ne fonctionnera plus.</p>
          <p className="mt-1 text-ink-soft">
            <span className="break-all line-through">{host}/{savedSlug}</span> mènera à une page introuvable. Partage le
            nouveau lien à tes clients (WhatsApp, Instagram, Facebook…).
          </p>
          <p className="mt-2 text-ink-soft">
            Si tu as installé l&apos;assistant sur ton site, son code contient aussi ce lien&nbsp;: après
            l&apos;enregistrement, copie le nouveau code depuis{" "}
            <Link href="/dashboard/widget" className="font-bold text-forest underline">
              Intégrer sur mon site
            </Link>{" "}
            et remplace l&apos;ancien.
          </p>
        </div>
      )}

      {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving || !dirty || !!liveError}
          className="min-h-11 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white transition hover:bg-forest-dark disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : slugChanged ? "Changer mon lien" : "Enregistrer"}
        </button>
        {saved && (
          <p role="status" className="text-sm font-semibold text-forest">
            Enregistré.
          </p>
        )}
      </div>
    </form>
  );
}
