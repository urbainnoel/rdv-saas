import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { CalendarIcon, ClockIcon, AssistantIcon } from "@/components/icons";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
        <BrandMark />
        <nav className="flex items-center gap-3 text-sm text-ink-soft sm:gap-6">
          <Link href="/login" className="whitespace-nowrap hover:text-ink">
            Connexion
          </Link>
          <Link
            href="/signup"
            className="whitespace-nowrap rounded-full bg-forest px-3 py-1.5 text-xs font-medium text-white transition hover:bg-forest-dark sm:px-4 sm:py-2 sm:text-sm"
          >
            Créer mon compte
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-6">
        <section className="animate-rise overflow-hidden rounded-[32px] bg-gradient-to-br from-forest to-forest-dark px-6 py-10 text-white shadow-sm sm:rounded-[40px] sm:px-14 sm:py-16">
          <div className="flex flex-col gap-6 sm:max-w-xl">
            <p className="text-sm font-medium text-amber-soft">
              Pour coachs, consultants et indépendants
            </p>
            <h1 className="font-display text-4xl italic leading-tight sm:text-6xl">
              Tes rendez-vous pris, confirmés et rappelés — sans que tu aies à y penser.
            </h1>
            <p className="text-lg leading-relaxed text-white/80">
              Tes clients réservent un créneau libre directement en ligne. Les
              deux côtés reçoivent un rappel avant l&apos;heure. Et un assistant
              répond à leurs questions courantes à ta place.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/signup"
                className="inline-block rounded-full bg-amber px-6 py-3 font-medium text-ink transition hover:bg-amber-dark hover:text-white"
              >
                Créer mon compte gratuitement
              </Link>
              <Link
                href="#assistant"
                className="inline-block rounded-full border border-white/30 px-6 py-3 font-medium text-white transition hover:border-white/60"
              >
                Discuter avec l&apos;assistant
              </Link>
            </div>
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
