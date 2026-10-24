"use client";

import { useState } from "react";

// Bouton « Renvoyer le lien » pour la confirmation d'email.
export default function ResendVerification({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function resend() {
    setState("sending");
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    setState("sent");
  }

  if (state === "sent") {
    return <p className="mt-4 text-sm text-forest">Lien renvoyé. Il peut mettre une minute à arriver.</p>;
  }

  return (
    <button
      type="button"
      onClick={resend}
      disabled={state === "sending"}
      className="mt-4 text-sm font-medium text-forest underline disabled:opacity-50"
    >
      {state === "sending" ? "Envoi…" : "Renvoyer le lien de confirmation"}
    </button>
  );
}
