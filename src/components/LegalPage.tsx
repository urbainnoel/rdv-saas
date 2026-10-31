import Link from "next/link";
import { LEGAL, TO_COMPLETE } from "@/lib/legal";

// Mise en page commune des pages légales, dans le style de la page d'accueil :
// bandeau vert, texte sobre et lisible sur téléphone.

export const LEGAL_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions", label: "Conditions d'utilisation" },
] as const;

export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Informations légales" className={`flex flex-wrap gap-x-5 gap-y-1 ${className}`}>
      {LEGAL_LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center underline-offset-4 hover:text-leaf hover:underline">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** Valeur de l'éditeur, ou un repère bien visible tant qu'elle n'est pas renseignée. */
export function LegalValue({ value }: { value: string | null }) {
  if (value) return <>{value}</>;
  return <span className="rounded bg-sun-soft px-1.5 py-0.5 font-semibold text-sun-ink">{TO_COMPLETE}</span>;
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{title}</h2>
      <div className="flex flex-col gap-3 text-[16px] font-medium leading-relaxed text-ink-soft [&_strong]:font-bold [&_strong]:text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export default function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col font-brand">
      <div className="bg-leaf text-white">
        <header className="mx-auto flex max-w-[1160px] items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-white">
            {LEGAL.serviceName}
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-white hover:text-sun">
            Accueil
          </Link>
        </header>
      </div>

      <main className="flex-1 bg-paper py-10 text-ink sm:py-16">
        <article className="mx-auto flex max-w-3xl flex-col gap-10 px-5 sm:px-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-[32px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[44px]">{title}</h1>
            <p className="text-sm font-semibold text-ink-faint">Dernière mise à jour&nbsp;: {LEGAL.lastUpdated}</p>
            {intro && <div className="text-lg font-medium leading-relaxed text-ink-soft">{intro}</div>}
          </div>
          {children}
        </article>
      </main>

      <footer className="border-t border-border bg-paper py-6">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-2 px-5 text-sm font-medium text-ink-faint sm:px-8 lg:px-12">
          <LegalLinks />
          <p>
            {LEGAL.serviceName} — contact&nbsp;: <LegalValue value={LEGAL.contactEmail} />
          </p>
        </div>
      </footer>
    </div>
  );
}
