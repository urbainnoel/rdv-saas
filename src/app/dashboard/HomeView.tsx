import Link from "next/link";
import type { DashboardStats } from "@/lib/dashboard-stats";
import { formatDateFr, formatTimeFr } from "@/lib/timezone";
import { CalendarIcon, PersonIcon, ClockIcon, CodeIcon } from "@/components/icons";
import Countdown from "./Countdown";
import SetupAccordion from "./SetupAccordion";

// Affichage de l'écran d'accueil (sans accès à la base : les chiffres
// arrivent déjà calculés), pour pouvoir le tester avec des données d'exemple.
export default function HomeView({
  entrepreneur,
  stats,
  tz,
  now = new Date(),
}: {
  entrepreneur: { businessName: string; slug: string };
  stats: DashboardStats;
  tz: string;
  now?: Date;
}) {
  const showSetup = !stats.hasAvailability || !stats.hasKnowledge;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-ink-faint first-letter:uppercase">{formatDateFr(now, tz)}</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Bonjour, {entrepreneur.businessName}
        </h1>
      </div>

      {showSetup && (
        <SetupAccordion
          hasAvailability={stats.hasAvailability}
          hasKnowledge={stats.hasKnowledge}
          slug={entrepreneur.slug}
          businessName={entrepreneur.businessName}
        />
      )}

      {/* ——— Les 3 indicateurs ——— */}
      <section aria-label="En un coup d'œil" className="grid grid-cols-2 gap-3 sm:gap-4">
        <Link
          href="/dashboard/agenda"
          className="col-span-2 flex flex-col gap-4 rounded-3xl bg-forest p-5 text-white transition hover:bg-forest-dark sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/80">Prochain rendez-vous</p>
              {stats.next ? (
                <>
                  <p className="mt-1 whitespace-nowrap text-[32px] font-extrabold leading-tight tracking-tight sm:text-5xl">
                    <Countdown startAt={stats.next.startAt.toISOString()} timezone={tz} />
                  </p>
                  <p className="mt-1 font-semibold text-white/90">
                    {stats.next.isToday ? "" : `${formatDateFr(stats.next.startAt, tz)}, `}
                    {formatTimeFr(stats.next.startAt, tz)} avec {stats.next.clientName}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-2xl font-extrabold tracking-tight">Aucun RDV à venir</p>
              )}
            </div>
            <div className="shrink-0 rounded-2xl bg-white/15 px-3 py-2.5 text-center sm:px-4 sm:py-3">
              <p className="text-3xl font-extrabold leading-none">{stats.todayCount}</p>
              <p className="mt-1 text-[11px] font-semibold leading-tight text-white/85 sm:text-xs">
                RDV
                <br className="sm:hidden" /> aujourd&apos;hui
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/leads"
          className="flex flex-col gap-1 rounded-3xl border border-border bg-surface p-5 transition hover:border-forest"
        >
          <p className="text-4xl font-extrabold tracking-tight text-ink">{stats.leadsToContact}</p>
          <p className="text-sm font-semibold text-ink-soft">
            {stats.leadsToContact === 1 ? "prospect à recontacter" : "prospects à recontacter"}
          </p>
        </Link>

        <Link
          href="/dashboard/agenda"
          className="flex flex-col gap-1 rounded-3xl border border-border bg-surface p-5 transition hover:border-forest"
        >
          <p className="text-4xl font-extrabold tracking-tight text-ink">{stats.bookings7d}</p>
          <p className="text-sm font-semibold text-ink-soft">
            {stats.bookings7d === 1 ? "réservation" : "réservations"} en 7 jours
          </p>
          {stats.bookings7d > 0 && (
            <p className="text-xs font-bold text-forest">dont {stats.bookings7dByAssistant} par l&apos;assistant</p>
          )}
        </Link>
      </section>

      {/* ——— Les 3 boutons ——— */}
      <nav aria-label="Accès rapides" className="grid grid-cols-3 gap-3 sm:gap-4">
        <BigButton href="/dashboard/agenda" label="Agenda" icon={<CalendarIcon className="h-7 w-7" />} />
        <BigButton
          href="/dashboard/leads"
          label="Prospects"
          icon={<PersonIcon className="h-7 w-7" />}
          badge={stats.leadsToContact}
        />
        <BigButton href="/dashboard/availability" label="Disponibilités" icon={<ClockIcon className="h-7 w-7" />} />
        <Link
          href="/dashboard/widget"
          className="col-span-3 flex min-h-14 items-center justify-center gap-2.5 rounded-3xl bg-forest px-4 font-extrabold text-white transition hover:bg-forest-dark"
        >
          <CodeIcon className="h-6 w-6" />
          Intégrer à mon site
        </Link>
      </nav>
    </div>
  );
}

function BigButton({
  href,
  label,
  icon,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="relative flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-3xl bg-amber px-1 py-4 text-center text-ink transition hover:bg-amber-dark hover:text-white"
    >
      {badge > 0 && (
        <span className="absolute right-2.5 top-2.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-forest px-1.5 text-xs font-extrabold text-white">
          {badge}
        </span>
      )}
      {icon}
      <span className="text-[13px] font-extrabold leading-tight sm:text-base">{label}</span>
    </Link>
  );
}
