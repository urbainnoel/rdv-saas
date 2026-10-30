"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MenuIcon } from "@/components/icons";

// Menu de l'en-tête sur mobile : « Connexion » et « Créer mon compte »
// repliés derrière un bouton, pour laisser toute la largeur au titre.
// Se ferme en touchant à côté ou avec la touche Échap.
export default function LandingMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="landing-menu"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          <MenuIcon className="h-6 w-6" />
        )}
      </button>
      {open && (
        <div
          id="landing-menu"
          className="absolute right-0 top-14 z-20 flex w-[230px] flex-col gap-1 rounded-2xl bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
        >
          <Link
            href="/login"
            className="flex min-h-12 items-center rounded-xl px-3.5 text-[15px] font-semibold text-ink hover:bg-leaf-soft"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="flex min-h-12 items-center justify-center rounded-xl bg-leaf px-3.5 text-[15px] font-bold text-white hover:bg-leaf-dark"
          >
            Créer mon compte
          </Link>
        </div>
      )}
    </div>
  );
}
