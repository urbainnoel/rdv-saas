import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { CalendarIcon, ClockIcon, AssistantIcon, MenuIcon } from "@/components/icons";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
        <BrandMark />

        {/* Écrans larges : liens visibles directement. */}
        <nav className="hidden items-center gap-6 text-sm text-ink-soft sm:flex">
          <Link href="/login" className="hover:text-ink">
            Connexion
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-forest px-4 py-2 font-medium text-white transition hover:bg-forest-dark"
          >
            Créer mon compte
          </Link>
        </nav>

        {/* Mobile : menu replié pour laisser l'espace au titre. */}
        <details className="relative sm:hidden">
          <summary className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink-soft transition hover:bg-forest-soft hover:text-forest">
            <MenuIcon className="h-6 w-6" />
          </summary>
          <div className="absolute right-0 top-12 z-20 flex w-48 flex-col gap-1 rounded-2xl border border-border bg-surface p-2 shadow-sm">
            <Link href="/login" className="rounded-xl px-3 py-2 text-sm text-ink-soft transition hover:bg-forest-soft hover:text-forest">
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-forest px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-forest-dark"
            >
              Créer mon compte
            </Link>
          </div>
        </details>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-6">
        <section className="flex flex-col gap-5 pb-10 pt-6 sm:py-24">
          <p className="text-sm font-medium text-ink-faint">
            Pour coachs, consultants et indépendants
          </p>
          <h1 className="max-w-xl font-display text-2xl leading-snug text-ink sm:text-4xl">
            Vos rendez-vous pris, confirmés et rappelés —{" "}
            <span className="italic text-forest">sans que vous ayez à y penser.</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/signup"
              className="inline-block rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white transition hover:bg-forest-dark"
            >
              Intégrer le chatbot à mon site
            </Link>
            <Link
              href="/signup"
              className="inline-block rounded-full border-2 border-forest px-5 py-2.5 text-sm font-medium text-forest transition hover:bg-forest-soft"
            >
              Créer mon espace de rendez-vous
            </Link>
          </div>
        </section>

        <section id="assistant" className="grid grid-cols-1 gap-4 py-10 sm:grid-cols-3 sm:gap-5 sm:py-16">
          <Feature
            tone="forest"
            className="sm:col-span-2"
            icon={<CalendarIcon className="h-6 w-6" />}
            title="Réservation en ligne"
            description="Tes clients voient tes créneaux libres et choisissent eux-mêmes leur rendez-vous, à toute heure."
          />
          <Feature
            tone="amber"
            icon={<ClockIcon className="h-6 w-6" />}
            title="Rappels aux deux parties"
            description="Confirmation et rappel envoyés par email et WhatsApp, pour réduire les absences."
          />
          <Feature
            tone="clay"
            icon={<AssistantIcon className="h-6 w-6" />}
            title="Assistant qui répond à ta place"
            description="Tarifs, horaires, annulation : un assistant répond aux questions courantes et transmet le reste."
          />
          <Feature
            tone="amber"
            className="sm:col-span-2"
            icon={<AssistantIcon className="h-6 w-6" />}
            title="Il peut même prendre le rendez-vous"
            description="Pas besoin d'aller-retour : l'assistant propose un créneau libre et réserve directement pour ton client, dans la conversation."
          />
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <p className="mx-auto w-full max-w-5xl px-6 text-sm text-ink-faint">
          RDV Assistant — conçu pour les indépendants qui n&apos;ont pas le temps de gérer ça à la main.
        </p>
      </footer>
    </div>
  );
}

const TONE_STYLES = {
  forest: { bg: "bg-forest-soft", icon: "text-forest" },
  amber: { bg: "bg-amber-soft", icon: "text-amber-dark" },
  clay: { bg: "bg-clay-soft", icon: "text-clay" },
} as const;

function Feature({
  icon,
  title,
  description,
  tone,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: keyof typeof TONE_STYLES;
  className?: string;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div className={`flex flex-col gap-3 rounded-3xl p-6 ${styles.bg} ${className}`}>
      <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/70 ${styles.icon}`}>
        {icon}
      </div>
      <h2 className="font-display text-lg text-ink">{title}</h2>
      <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
    </div>
  );
}
