// Signature visuelle de la marque : une grille de cases d'agenda, dont
// certaines « réservées » (ambre), posée dans un angle de la page.
// Purement décoratif : ignoré par les lecteurs d'écran et les clics.

const BOOKED = new Set([3, 9, 10, 16, 22, 24, 30]);
const SOFT = new Set([1, 12, 18, 27, 33]);

const TONES = {
  // Sur le fond vert de la page d'accueil
  onLeaf: { base: "bg-white/10", soft: "bg-white/30", booked: "bg-sun" },
  // Sur le fond clair des pages de connexion / inscription
  onPaper: { base: "bg-leaf/[0.07]", soft: "bg-leaf/[0.16]", booked: "bg-sun" },
} as const;

export default function AgendaCorner({
  tone = "onPaper",
  className = "",
}: {
  tone?: keyof typeof TONES;
  /** Affichage, position et taille, ex. "absolute -bottom-8 -right-8 hidden w-[300px] lg:grid". */
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div aria-hidden className={`pointer-events-none grid-cols-7 gap-2.5 ${className}`}>
      {Array.from({ length: 35 }, (_, i) => (
        <div
          key={i}
          className={`aspect-square rounded-lg ${BOOKED.has(i) ? t.booked : SOFT.has(i) ? t.soft : t.base}`}
        />
      ))}
    </div>
  );
}
