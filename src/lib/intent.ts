// Ce que le visiteur voulait faire en cliquant sur la page d'accueil, pour
// l'emmener au bon endroit juste après l'inscription.
//   chatbot : « Installer le chatbot »  → page « Intégrer sur mon site »
//   lien    : « Créer mon lien »        → « Disponibilités » (sans horaires,
//             le lien de réservation n'a aucun créneau à proposer)

export type SignupIntent = "chatbot" | "lien";

export function parseIntent(value: unknown): SignupIntent | null {
  return value === "chatbot" || value === "lien" ? value : null;
}

export function destinationFor(intent: SignupIntent | null): string {
  if (intent === "chatbot") return "/dashboard/widget";
  if (intent === "lien") return "/dashboard/availability";
  return "/dashboard";
}
