// Règles du lien public (/<slug>) quand l'entrepreneur le choisit lui-même.
// Module sans accès à la base : partagé entre l'API et le formulaire (aperçu en direct).

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

// Mots qui entreraient en conflit avec une page ou un fichier de l'application
// (dossiers de src/app et de public/), ou qui prêteraient à confusion.
// Les routes statiques de Next passent avant [slug] : un slug « login »
// rendrait la page de réservation inaccessible.
export const RESERVED_SLUGS = new Set([
  // Routes existantes
  "api", "dashboard", "embed", "login", "signup", "widget", "widget-js",
  // Routes prévues ou en cours (pages légales, gestion d'un RDV par le client)
  "rdv", "mentions-legales", "confidentialite", "conditions",
  // Fichiers et routes générés par Next
  "favicon", "icon", "apple-icon", "robots", "sitemap", "manifest",
  "opengraph-image", "twitter-image", "next", "static", "public", "assets",
  // Comptes et administration
  "admin", "administrateur", "app", "www", "auth", "oauth", "logout", "deconnexion",
  "connexion", "inscription", "register", "compte", "account", "settings", "parametres",
  "profil", "profile", "verify", "verify-email", "reset-password", "mot-de-passe",
  // Pages courantes qu'on pourrait vouloir créer
  "aide", "help", "support", "contact", "about", "a-propos", "legal", "privacy", "terms",
  "cgu", "cgv", "tarifs", "pricing", "blog", "docs", "faq", "status", "accueil", "home",
  "index", "reservation", "booking", "book", "slots", "chat", "cron", "null", "undefined",
]);

/** Ce que l'utilisateur tape → forme normalisée (minuscules, sans espaces autour). */
export function normalizeSlug(input: string): string {
  return input.trim().toLowerCase();
}

/** Renvoie un message d'erreur en français, ou null si le slug est valide. */
export function slugError(slug: string): string | null {
  if (slug.length < SLUG_MIN) return `Le lien doit faire au moins ${SLUG_MIN} caractères.`;
  if (slug.length > SLUG_MAX) return `Le lien doit faire au plus ${SLUG_MAX} caractères.`;
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return "Utilise seulement des lettres minuscules sans accent (a-z), des chiffres et des tirets.";
  }
  if (slug.startsWith("-") || slug.endsWith("-")) {
    return "Le lien ne peut pas commencer ni finir par un tiret.";
  }
  if (RESERVED_SLUGS.has(slug)) return "Ce lien est réservé par l'application, choisis-en un autre.";
  return null;
}
