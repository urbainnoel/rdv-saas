import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentEntrepreneur } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) redirect("/login");

  return (
    <div className="flex min-h-full flex-1">
      <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white p-4">
        <p className="mb-6 truncate font-semibold">{entrepreneur.businessName}</p>
        <nav className="space-y-1 text-sm">
          <Link href="/dashboard" className="block rounded-lg px-3 py-2 hover:bg-neutral-100">
            📅 Agenda
          </Link>
          <Link
            href="/dashboard/availability"
            className="block rounded-lg px-3 py-2 hover:bg-neutral-100"
          >
            🕒 Disponibilités
          </Link>
          <Link
            href="/dashboard/templates"
            className="block rounded-lg px-3 py-2 hover:bg-neutral-100"
          >
            💬 Messages
          </Link>
          <Link
            href="/dashboard/knowledge-base"
            className="block rounded-lg px-3 py-2 hover:bg-neutral-100"
          >
            🤖 Assistant (FAQ)
          </Link>
          <Link
            href={`/${entrepreneur.slug}`}
            target="_blank"
            className="block rounded-lg px-3 py-2 hover:bg-neutral-100"
          >
            🔗 Page publique
          </Link>
        </nav>
        <div className="mt-6 border-t border-neutral-200 pt-4">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
