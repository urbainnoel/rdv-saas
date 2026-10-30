import Link from "next/link";
import { connection } from "next/server";
import { googleConfigured } from "@/lib/google";
import PhoneMockup from "@/components/landing/PhoneMockup";
import LandingMenu from "@/components/landing/LandingMenu";
import AgendaCorner from "@/components/AgendaCorner";

export default async function Home() {
  // Lu à chaque requête : le bouton Google n'apparaît que s'il est configuré.
  await connection();
  const google = googleConfigured();

  return (
    <div className="flex flex-1 flex-col font-brand">
      {/* ——— Haut de page ——— */}
      <div className="relative overflow-hidden bg-leaf text-white">
        <AgendaCorner tone="onLeaf" className="absolute -bottom-8 -right-8 hidden w-[300px] lg:grid" />

        <div className="relative mx-auto max-w-[1160px] px-5 sm:px-8 lg:px-12">
          <header className="flex items-center justify-between gap-4 py-6">
            <Link href="/" className="text-xl font-extrabold tracking-tight text-white">
              RDV Assistant
            </Link>
            <nav className="hidden items-center gap-5 sm:flex">
              <Link href="/login" className="text-[15px] font-semibold text-white hover:text-sun">
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-white px-[18px] py-[11px] text-[15px] font-bold text-leaf transition hover:bg-leaf-soft"
              >
                Créer mon compte
              </Link>
            </nav>
            <LandingMenu />
          </header>

          <section className="flex flex-wrap items-center justify-between gap-12 pb-12 pt-6 sm:pb-20 sm:pt-12">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-7">
              <h1 className="text-[42px] font-extrabold leading-[1.02] tracking-[-0.025em] sm:text-6xl lg:text-[76px]">
                Votre assistant commercial
              </h1>
              <p className="text-lg font-medium leading-relaxed text-[#E6F4EC] sm:text-2xl">
                Il répond à vos clients, 24&nbsp;h/24.
                <br />
                Il prend leurs rendez-vous directement.
                <br />
                Il garde le contact de ceux qui hésitent.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex min-h-[52px] items-center rounded-2xl bg-sun px-6 text-[17px] font-bold text-ink transition hover:bg-sun-dark"
                >
                  Commencer gratuitement
                </Link>
                {google && (
                  /* Navigation complète voulue : la route redirige vers Google. */
                  /* eslint-disable-next-line @next/next/no-html-link-for-pages */
                  <a
                    href="/api/auth/google"
                    className="inline-flex min-h-[52px] items-center rounded-2xl border-2 border-white/55 px-6 text-[17px] font-bold text-white transition hover:border-white"
                  >
                    Continuer avec Google
                  </a>
                )}
              </div>
              <p className="text-sm font-medium text-leaf-mist">Gratuit pour commencer, sans carte bancaire.</p>
            </div>

            {/* Sur mobile, le téléphone est retiré : les cartes plus bas
                contiennent déjà une démonstration, et on évite un long défilement. */}
            <div className="mx-auto hidden flex-[0_1_300px] justify-center lg:flex">
              <PhoneMockup />
            </div>
          </section>
        </div>
      </div>

      {/* ——— Deux façons d'utiliser l'assistant ——— */}
      <main className="flex-1 bg-paper py-12 text-ink sm:py-20">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-10 px-5 sm:px-8 lg:px-12">
          <div className="flex max-w-2xl flex-col gap-2.5">
            <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[44px]">
              Deux façons d&apos;utiliser votre assistant
            </h2>
            <p className="text-lg font-medium leading-relaxed text-ink-soft">
              Le même assistant, sur votre site ou derrière un simple lien.
            </p>
          </div>

          <div className="flex flex-wrap items-stretch gap-6">
            <article className="flex min-w-0 flex-[1_1_380px] flex-col gap-5 rounded-[28px] border border-border bg-white p-6 sm:p-8">
              <span className="self-start rounded-full bg-leaf-soft px-3.5 py-1.5 text-[13px] font-bold text-leaf">
                Vous avez déjà un site web
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-extrabold tracking-tight">Intégrer le chatbot à mon site</h3>
                <p className="font-medium leading-relaxed text-ink-soft">
                  Une bulle de discussion sur votre site&nbsp;: elle répond à vos clients et prend leurs
                  rendez-vous.
                </p>
              </div>
              <div aria-hidden className="flex flex-1 flex-col gap-2.5 rounded-[20px] bg-[#F3F6F2] p-[18px] text-sm font-medium">
                <p className="max-w-[80%] self-end rounded-2xl rounded-br-[4px] border border-border bg-white px-3 py-2.5">
                  Vous acceptez Orange Money&nbsp;?
                </p>
                <p className="max-w-[86%] self-start rounded-2xl rounded-bl-[4px] bg-leaf px-3 py-2.5 leading-snug text-white">
                  Oui&nbsp;! Et je peux vous réserver un créneau dès maintenant&nbsp;:
                </p>
                <div className="flex flex-wrap gap-2 text-[13px] font-bold">
                  <span className="rounded-full border-[1.5px] border-leaf bg-white px-3.5 py-2 text-leaf">Mardi 10:00</span>
                  <span className="rounded-full border-[1.5px] border-leaf bg-white px-3.5 py-2 text-leaf">Mardi 14:30</span>
                </div>
              </div>
              <Link
                href="/signup?intent=chatbot"
                className="flex min-h-[52px] items-center justify-center rounded-2xl bg-leaf text-[17px] font-bold text-white transition hover:bg-leaf-dark"
              >
                Installer le chatbot
              </Link>
            </article>

            <article className="flex min-w-0 flex-[1_1_380px] flex-col gap-5 rounded-[28px] border border-border bg-white p-6 sm:p-8">
              <span className="self-start rounded-full bg-sun-soft px-3.5 py-1.5 text-[13px] font-bold text-sun-ink">
                Pas de site&nbsp;? Aucun problème
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-extrabold tracking-tight">Créer mon lien de réservation</h3>
                <p className="font-medium leading-relaxed text-ink-soft">
                  Un lien à partager sur WhatsApp, Instagram ou Facebook. Vos clients choisissent leur
                  créneau seuls.
                </p>
              </div>
              <div aria-hidden className="flex flex-1 flex-col gap-3.5 rounded-[20px] bg-[#F3F6F2] p-[18px]">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5 text-[13px] font-semibold text-ink-soft">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                    <path
                      d="M10 14 14 10M9 15l-1.8 1.8a3 3 0 1 1-4.2-4.2L5 11M15 9l1.8-1.8a3 3 0 1 1 4.2 4.2L19 13"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  …/fatou-coaching
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold">Mardi 3 novembre</span>
                  <span className="text-[13px] font-bold text-sun-ink">3 créneaux libres</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="flex h-11 items-center justify-center rounded-[10px] bg-sun font-bold">10:00</span>
                  <span className="flex h-11 items-center justify-center rounded-[10px] border border-border bg-white font-semibold">14:30</span>
                  <span className="flex h-11 items-center justify-center rounded-[10px] border border-border bg-white font-semibold">16:00</span>
                </div>
                <span className="text-[13px] font-medium text-[#56625B]">
                  Confirmation immédiate, rappel la veille et 1&nbsp;h avant.
                </span>
              </div>
              <Link
                href="/signup?intent=lien"
                className="flex min-h-[52px] items-center justify-center rounded-2xl bg-sun text-[17px] font-bold text-ink transition hover:bg-sun-dark"
              >
                Créer mon lien
              </Link>
            </article>
          </div>

          <ul className="flex flex-wrap gap-4">
            <Guarantee title="0 % de commission" text="Vos honoraires restent entièrement à vous." />
            <Guarantee title="Gratuit" text="Pour commencer, sans carte bancaire." />
            <Guarantee title="24 h/24" text="Votre assistant répond même quand vous dormez." />
          </ul>
        </div>
      </main>

      <footer className="border-t border-border bg-paper py-8">
        <p className="mx-auto max-w-[1160px] px-5 text-sm font-medium text-ink-faint sm:px-8 lg:px-12">
          RDV Assistant — vos clients réservent seuls. Vous, vous travaillez.
        </p>
      </footer>
    </div>
  );
}

function Guarantee({ title, text }: { title: string; text: string }) {
  return (
    <li className="flex flex-[1_1_240px] flex-col gap-1 rounded-[20px] border border-border bg-white px-[22px] py-5">
      <span className="text-[26px] font-extrabold text-leaf">{title}</span>
      <span className="text-[15px] font-medium text-ink-soft">{text}</span>
    </li>
  );
}
