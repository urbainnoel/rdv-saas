// Téléphone de démonstration de la page d'accueil : une vraie conversation
// où l'assistant propose deux créneaux et confirme le rendez-vous.
// Purement illustratif (pas interactif) : caché aux lecteurs d'écran, qui
// ont déjà les mêmes informations dans le texte de la page.

function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 13l4.5 4.5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PhoneMockup() {
  return (
    <div
      aria-hidden
      className="h-[620px] w-[300px] shrink-0 rounded-[46px] bg-[#14171A] p-2.5 font-brand text-ink shadow-[0_30px_60px_rgba(0,0,0,0.22)]"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[36px] bg-[#F4F6F2]">
        <div className="flex items-center gap-2.5 bg-leaf px-4 pb-3.5 pt-5 text-white">
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-white/20 text-[13px] font-extrabold">
            FC
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-bold">Fatou Coaching</span>
            <span className="text-[11px] font-medium text-white/90">Répond en quelques secondes</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 overflow-hidden px-3.5 py-4 text-[13px] font-medium leading-snug">
          <p className="max-w-[78%] self-end rounded-2xl rounded-br-[4px] bg-leaf px-3 py-2.5 text-white">
            Bonjour, vous êtes dispo mardi&nbsp;?
          </p>
          <p className="max-w-[82%] self-start rounded-2xl rounded-bl-[4px] border border-[#E1E6E0] bg-white px-3 py-2.5">
            Bonjour&nbsp;! Mardi, j&apos;ai deux créneaux libres&nbsp;:
          </p>
          <div className="flex gap-2 font-bold">
            <span className="rounded-full bg-leaf px-3.5 py-2 text-white">10:00</span>
            <span className="rounded-full border-[1.5px] border-leaf px-3.5 py-[7px] text-leaf">14:30</span>
          </div>
          <p className="max-w-[78%] self-end rounded-2xl rounded-br-[4px] bg-leaf px-3 py-2.5 text-white">
            10:00, s&apos;il vous plaît
          </p>
          <div className="flex w-[86%] flex-col gap-1.5 self-start rounded-2xl rounded-bl-[4px] border border-[#E1E6E0] bg-white px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-leaf text-white">
                <Check className="h-3 w-3" />
              </span>
              <span className="font-bold">C&apos;est confirmé, Aïssatou&nbsp;!</span>
            </div>
            <span className="font-semibold">Mardi 3 novembre à 10:00</span>
            <span className="text-[11px] text-[#56625B]">Rappel la veille et 1 h avant.</span>
          </div>
        </div>

        <div className="mx-3 mb-4 flex items-center gap-2 rounded-full border border-[#E1E6E0] bg-white py-1.5 pl-3.5 pr-1.5">
          <span className="flex-1 text-xs text-[#6B766F]">Écrivez votre message…</span>
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-leaf text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
              <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
