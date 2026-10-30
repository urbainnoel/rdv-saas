"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";

// Sur ordinateur, petit lien « Retour à l'accueil » en haut des rubriques
// (sur mobile, la flèche est dans la barre verte du haut).
export default function DesktopBack() {
  const pathname = usePathname();
  if (pathname === "/dashboard") return null;
  return (
    <Link
      href="/dashboard"
      className="mb-4 hidden items-center gap-1.5 text-sm font-bold text-ink-soft transition hover:text-forest sm:inline-flex"
    >
      <ArrowLeftIcon className="h-4 w-4" />
      Retour à l&apos;accueil
    </Link>
  );
}
