// Ces valeurs remplacent les enums natifs de la base (SQLite ne les supporte pas).
// On les valide ici côté application.

export const AppointmentStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW",
} as const;
export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const MessageTemplateType = {
  CONFIRMATION: "CONFIRMATION",
  REMINDER_24H: "REMINDER_24H",
  REMINDER_1H: "REMINDER_1H",
  THANK_YOU: "THANK_YOU",
  NO_SHOW_FOLLOWUP: "NO_SHOW_FOLLOWUP",
  INACTIVE_CLIENT: "INACTIVE_CLIENT",
  REVIEW_REQUEST: "REVIEW_REQUEST",
} as const;
export type MessageTemplateType =
  (typeof MessageTemplateType)[keyof typeof MessageTemplateType];

// Templates par défaut proposés à chaque nouvel entrepreneur.
// Variables disponibles : {prenom_client}, {date}, {heure}, {nom_entrepreneur}
export const DEFAULT_MESSAGE_TEMPLATES: Record<MessageTemplateType, string> = {
  CONFIRMATION:
    "Bonjour {prenom_client}, votre rendez-vous avec {nom_entrepreneur} est confirmé le {date} à {heure}. À bientôt !",
  REMINDER_24H:
    "Rappel : vous avez rendez-vous avec {nom_entrepreneur} demain {date} à {heure}. Répondez OUI pour confirmer ou NON pour annuler.",
  REMINDER_1H:
    "Petit rappel : votre rendez-vous avec {nom_entrepreneur} est dans 1h ({heure}).",
  THANK_YOU:
    "Merci {prenom_client} pour votre visite ! N'hésitez pas à reprendre rendez-vous quand vous le souhaitez.",
  NO_SHOW_FOLLOWUP:
    "Bonjour {prenom_client}, nous ne vous avons pas vu(e) pour votre RDV du {date}. On reprogramme ?",
  INACTIVE_CLIENT:
    "Bonjour {prenom_client}, ça fait un moment ! Vous souhaitez reprendre un rendez-vous avec {nom_entrepreneur} ?",
  REVIEW_REQUEST:
    "Merci pour votre visite ! Un avis de votre part ferait très plaisir à {nom_entrepreneur} 🙏",
};
