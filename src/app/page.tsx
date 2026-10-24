import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { CalendarIcon, ClockIcon, AssistantIcon } from "@/components/icons";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <BrandMark />
        <nav className="flex items-center gap-6 text-sm text-ink-soft">
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
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="flex flex-col gap-6 py-16 sm:py-24">
          <p className="text-sm font-medium text-forest">
            Pour coachs, consultants et indépendants
          </p>
          <h1 className="max-w-2xl font-display text-4xl italic leading-tight text-ink sm:text-5xl">
            Tes rendez-vous pris, confirmés et rappelés — sans que tu aies à y penser.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
            Tes clients réservent un créneau libre directement en ligne. Les
            deux côtés reçoivent un rappel avant l&apos;heure. Et un assistant
            répond à leurs questions courantes à ta place.
          </p>
          <div>
            <Link
              href="/signup"
              className="inline-block rounded-full bg-amber px-6 py-3 font-medium text-ink transition hover:bg-amber-dark hover:text-white"
            >
              Créer mon compte gratuitement
            </Link>
          </div>
        </section>

        <section className="grid gap-10 border-t border-border py-16 sm:grid-cols-3">
          <Feature
            icon={<CalendarIcon className="h-6 w-6" />}
            title="Réservation en ligne"
            description="Tes clients voient tes créneaux libres et choisissent eux-mêmes leur rendez-vous, à toute heure."
          />
          <Feature
            icon={<ClockIcon className="h-6 w-6" />}
            title="Rappels aux deux parties"
            description="Confirmation et rappel envoyés par email et WhatsApp, à toi et à ton client, pour réduire les absences."
          />
          <Feature
            icon={<AssistantIcon className="h-6 w-6" />}
            title="Assistant pour les questions courantes"
            description="Tarifs, horaires, politique d'annulation : un assistant répond à la place, et te transmet le reste."
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

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-soft text-forest">
        {icon}
      </div>
      <h2 className="font-display text-lg text-ink">{title}</h2>
      <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
    </div>
  );
}
