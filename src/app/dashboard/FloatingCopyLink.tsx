"use client";

import { useState } from "react";
import { LinkIcon, CheckIcon } from "@/components/icons";

// Bouton flottant, présent sur toutes les pages du tableau de bord :
// copie le lien de réservation en un geste. Semi-transparent pour ne pas
// masquer le contenu, il devient opaque au survol ou au focus.
export default function FloatingCopyLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie ton lien :", url);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-30 flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md transition sm:bottom-6 sm:right-6 ${
        copied ? "bg-forest" : "bg-forest/60 hover:bg-forest focus-visible:bg-forest"
      }`}
    >
      {copied ? <CheckIcon className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
      {copied ? "Lien copié" : "Copier mon lien"}
    </button>
  );
}
