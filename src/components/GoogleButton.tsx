// « Continuer avec Google » : simple lien (navigation complète vers Google),
// suivi d'un séparateur avant le formulaire email + mot de passe.
import type { SignupIntent } from "@/lib/intent";

export default function GoogleButton({ intent = null }: { intent?: SignupIntent | null }) {
  return (
    <div className="mt-8">
      {/* Navigation complète voulue : la route redirige vers Google. */}
      <a
        href={intent ? `/api/auth/google?intent=${intent}` : "/api/auth/google"}
        className="flex w-full items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 font-medium text-ink transition hover:border-forest hover:text-forest"
      >
        Continuer avec Google
      </a>
      <div className="mt-6 flex items-center gap-3 text-xs text-ink-faint">
        <span className="h-px flex-1 bg-border" />
        ou avec ton email
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
