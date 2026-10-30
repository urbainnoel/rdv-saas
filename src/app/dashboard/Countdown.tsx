"use client";

import { useEffect, useState } from "react";

// Temps restant avant le prochain RDV, mis à jour toutes les 30 secondes.
// « dans 1 h 25 », « dans 12 min », « maintenant » ; au-delà de 24 h, le jour.
function label(startAt: Date, now: Date, timezone: string): string {
  const minutes = Math.round((startAt.getTime() - now.getTime()) / 60000);
  if (minutes <= 0) return "maintenant";
  if (minutes < 60) return `dans ${minutes} min`;
  if (minutes < 24 * 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `dans ${h} h` : `dans ${h} h ${String(m).padStart(2, "0")}`;
  }
  const day = startAt.toLocaleDateString("fr-FR", { weekday: "long", timeZone: timezone });
  const days = Math.floor(minutes / (24 * 60));
  return days === 1 ? "demain" : day;
}

export default function Countdown({ startAt, timezone }: { startAt: string; timezone: string }) {
  const target = new Date(startAt);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return <span suppressHydrationWarning>{label(target, now, timezone)}</span>;
}
