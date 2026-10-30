import { googleConfigured } from "@/lib/google";
import LoginForm from "./LoginForm";
import AgendaCorner from "@/components/AgendaCorner";

const MESSAGES: Record<string, string> = {
  "verification:invalid":
    "Ce lien de confirmation n'est plus valable. Connecte-toi pour en recevoir un nouveau.",
  "google:error": "La connexion avec Google n'a pas abouti. Réessaie.",
  "google:cancelled": "Connexion avec Google annulée.",
  "google:unavailable": "La connexion avec Google n'est pas encore disponible.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const key =
    typeof params.verification === "string"
      ? `verification:${params.verification}`
      : typeof params.google === "string"
        ? `google:${params.google}`
        : "";
  return (
    <>
      <AgendaCorner className="fixed -bottom-10 -right-10 -z-10 hidden w-[260px] md:grid" />
      <LoginForm initialError={MESSAGES[key] ?? null} googleEnabled={googleConfigured()} />
    </>
  );
}
