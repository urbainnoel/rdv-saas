"use client";

import { useState } from "react";
import { AssistantIcon, CalendarIcon } from "@/components/icons";
import BookingWidget from "./BookingWidget";
import ChatWidget from "./ChatWidget";

type Mode = "choice" | "chat" | "form";

export default function BookingEntry({
  slug,
  businessName,
  logoUrl,
}: {
  slug: string;
  businessName: string;
  logoUrl?: string | null;
}) {
  const [mode, setMode] = useState<Mode>("choice");

  if (mode === "choice") {
    return (
      <div className="animate-rise">
        <div className="flex items-center gap-3">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={businessName}
              className="h-10 w-10 shrink-0 rounded-lg border border-border object-contain"
            />
          )}
          <p className="font-display font-extrabold tracking-tight text-2xl text-ink">{businessName}</p>
        </div>
        <p className="mt-1 text-ink-soft">Comment préférez-vous faire ?</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setMode("chat")}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-forest hover:shadow-md"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-soft text-forest">
                <AssistantIcon className="h-5 w-5" />
              </span>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-forest" />
              </span>
            </span>
            <span>
              <span className="block font-medium text-ink">Discuter avec l&apos;assistant</span>
              <span className="mt-0.5 block text-sm text-ink-soft">
                Posez vos questions et réservez votre créneau directement dans la conversation.
              </span>
            </span>
          </button>

          <button
            onClick={() => setMode("form")}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-forest hover:shadow-md"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-soft text-amber-dark">
              <CalendarIcon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-medium text-ink">Remplir le formulaire</span>
              <span className="mt-0.5 block text-sm text-ink-soft">
                Choisissez vous-même votre service et votre créneau, étape par étape.
              </span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <button
        onClick={() => setMode("choice")}
        className="mb-4 text-sm text-ink-soft underline hover:text-ink"
      >
        ← Changer de méthode
      </button>
      {mode === "chat" ? (
        <ChatWidget slug={slug} businessName={businessName} />
      ) : (
        <BookingWidget slug={slug} />
      )}
    </div>
  );
}
