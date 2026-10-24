"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  ClockIcon,
  MessageIcon,
  AssistantIcon,
  LinkIcon,
  LogoutIcon,
} from "@/components/icons";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Agenda", icon: CalendarIcon, exact: true },
  { href: "/dashboard/availability", label: "Disponibilités", icon: ClockIcon },
  { href: "/dashboard/templates", label: "Messages", icon: MessageIcon },
  { href: "/dashboard/knowledge-base", label: "Assistant (FAQ)", icon: AssistantIcon },
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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-forest text-white">
      <div className="px-5 py-6">
        <p className="font-display text-lg italic leading-tight">{businessName}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
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
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
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
  );
}
