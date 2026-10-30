"use client";

import { useState } from "react";

// Partager le lien de réservation : WhatsApp (message prêt) ou copie.
export default function ShareLink({ slug, businessName }: { slug: string; businessName: string }) {
  const [copied, setCopied] = useState(false);

  function url() {
    return `${window.location.origin}/${slug}`;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie ton lien :", url());
    }
  }

  function whatsapp() {
    const text = `Bonjour ! Vous pouvez réserver un rendez-vous avec ${businessName} ici : ${url()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={whatsapp}
        className="rounded-xl bg-forest px-3.5 py-2 text-sm font-bold text-white transition hover:bg-forest-dark"
      >
        Envoyer sur WhatsApp
      </button>
      <button
        type="button"
        onClick={copy}
        className="rounded-xl border-2 border-border bg-surface px-3.5 py-2 text-sm font-bold text-ink transition hover:border-forest hover:text-forest"
      >
        {copied ? "Lien copié" : "Copier le lien"}
      </button>
    </div>
  );
}
