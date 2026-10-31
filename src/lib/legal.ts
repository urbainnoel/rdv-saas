// Informations légales de l'éditeur, centralisées ici pour les pages
// /mentions-legales, /confidentialite et /conditions.
// Une valeur null s'affiche « [à compléter] » : ne rien inventer, remplir
// ces champs avec les vraies informations avant d'en faire la promotion.

export const LEGAL = {
  /** Nom du service tel qu'affiché aux utilisateurs. */
  serviceName: "RDV Assistant",
  /** Raison sociale (ou nom et prénom si entrepreneur individuel). */
  companyName: null as string | null,
  /** Forme juridique et capital, ex. « SARLU au capital de … GNF ». */
  legalForm: null as string | null,
  /** Adresse postale complète du siège. */
  address: null as string | null,
  /** Numéro d'immatriculation au RCCM. */
  rccm: null as string | null,
  /** Adresse email de contact (questions, exercice des droits). */
  contactEmail: null as string | null,
  /** Personne responsable du contenu publié. */
  publicationDirector: null as string | null,
  /** Date affichée en haut de chaque page légale. */
  lastUpdated: "31 octobre 2026",
};

export const TO_COMPLETE = "[à compléter]";
