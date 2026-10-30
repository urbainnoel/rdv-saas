"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  ClockIcon,
  MessageIcon,
  AssistantIcon,
  LinkIcon,
  LogoutIcon,
  TagIcon,
  CodeIcon,
  SettingsIcon,
  MenuIcon,
  PersonIcon,
} from "@/components/icons";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Agenda", icon: CalendarIcon, exact: true },
  { href: "/dashboard/leads", label: "Prospects", icon: PersonIcon },
  { href: "/dashboard/availability", label: "Disponibilités", icon: ClockIcon },
  { href: "/dashboard/services", label: "Services", icon: TagIcon },
  { href: "/dashboard/templates", label: "Messages", icon: MessageIcon },
  { href: "/dashboard/knowledge-base", label: "Bibliothèque assistant", icon: AssistantIcon },
  { href: "/dashboard/widget", label: "Intégrer sur mon site", icon: CodeIcon },
  { href: "/dashboard/settings", label: "Paramètres", icon: SettingsIcon },
];

export default function Sidebar({
  businessName,
  slug,
}: {
  businessName: string;
  slug: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Barre du haut, visible uniquement sur mobile/tablette : le menu
          latéral complet est caché derrière, ouvert via le bouton burger. */}
      <div className="flex items-center justify-between bg-forest px-4 py-3 text-white sm:hidden">
        <p className="font-display font-extrabold tracking-tight leading-tight">{businessName}</p>
        <button onClick={() => setOpen(true)} aria-label="Ouvrir le menu" className="p-1">
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Fond assombri derrière le menu ouvert, pour le refermer en tapant à côté. */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] shrink-0 flex-col bg-forest text-white transition-transform duration-200 sm:static sm:z-auto sm:w-60 sm:max-w-none sm:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          <p className="font-display font-extrabold tracking-tight text-lg leading-tight">{businessName}</p>
          <button onClick={() => setOpen(false)} aria-label="Fermer le menu" className="p-1 text-xl leading-none sm:hidden">
            ×
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-white/15 font-medium text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </Link>
            );
          })}

          <a
            href={`/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <LinkIcon className="h-[18px] w-[18px]" />
            Page publique
          </a>
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}
