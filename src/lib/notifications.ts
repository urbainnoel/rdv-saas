// Envoi des notifications (email + WhatsApp) aux clients et entrepreneurs.
// Pour l'instant : les envois réels (Resend, WhatsApp Business API) seront
// branchés une fois les comptes/API keys configurés. En attendant, on logue
// le message qui AURAIT été envoyé, pour pouvoir tester tout le flux.

import { schema } from "@/db";
import { DEFAULT_MESSAGE_TEMPLATES, MessageTemplateType } from "./enums";

type Entrepreneur = typeof schema.entrepreneurs.$inferSelect;
type Client = typeof schema.clients.$inferSelect;
type Appointment = typeof schema.appointments.$inferSelect;

function formatMessage(
  template: string,
  vars: { prenom_client: string; date: string; heure: string; nom_entrepreneur: string }
): string {
  return template
    .replace(/{prenom_client}/g, vars.prenom_client)
    .replace(/{date}/g, vars.date)
    .replace(/{heure}/g, vars.heure)
    .replace(/{nom_entrepreneur}/g, vars.nom_entrepreneur);
}

function buildVars(entrepreneur: Entrepreneur, client: Client, appointment: Appointment) {
  const start = new Date(appointment.startAt);
  return {
    prenom_client: client.fullName.split(" ")[0],
    date: start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
    heure: start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    nom_entrepreneur: entrepreneur.businessName,
  };
}

async function dispatch(channel: "email" | "whatsapp", to: string | null, message: string) {
  if (!to) return;
  // TODO: brancher Resend (email) et l'API WhatsApp Business ici.
  console.log(`[NOTIFICATION:${channel.toUpperCase()}] -> ${to}\n${message}\n`);
}

export async function sendAppointmentConfirmation({
  entrepreneur,
  client,
  appointment,
}: {
  entrepreneur: Entrepreneur;
  client: Client;
  appointment: Appointment;
}) {
  const vars = buildVars(entrepreneur, client, appointment);
  const message = formatMessage(DEFAULT_MESSAGE_TEMPLATES.CONFIRMATION, vars);

  await dispatch("email", client.email, message);
  await dispatch("whatsapp", client.phone, message);
}

export async function sendReminder({
  entrepreneur,
  client,
  appointment,
  type,
}: {
  entrepreneur: Entrepreneur;
  client: Client;
  appointment: Appointment;
  type: Extract<MessageTemplateType, "REMINDER_24H" | "REMINDER_1H">;
}) {
  const vars = buildVars(entrepreneur, client, appointment);
  const message = formatMessage(DEFAULT_MESSAGE_TEMPLATES[type], vars);

  await dispatch("email", client.email, message);
  await dispatch("whatsapp", client.phone, message);

  // Notifier aussi l'entrepreneur lui-même (rappel bidirectionnel)
  await dispatch(
    "email",
    entrepreneur.email,
    `Rappel : RDV avec ${client.fullName} le ${vars.date} à ${vars.heure}.`
  );
}

// Quand l'assistant (chatbot) ne trouve pas de réponse dans la FAQ, on
// transmet la question à l'entrepreneur plutôt que de laisser le client
// sans réponse.
export async function notifyUnansweredQuestion({
  entrepreneur,
  question,
}: {
  entrepreneur: Entrepreneur;
  question: string;
}) {
  await dispatch(
    "email",
    entrepreneur.email,
    `Un client a posé une question à ton assistant sans réponse disponible :\n« ${question} »\n\nPense à y répondre toi-même, et à l'ajouter à ta FAQ si elle revient souvent.`
  );
}

// Quand l'assistant détecte un prospect intéressé qui n'a pas encore
// réservé mais a donné son contact, on prévient l'entrepreneur pour qu'il
// puisse relancer lui-même.
export async function notifyNewLead({
  entrepreneur,
  leadName,
  leadContact,
}: {
  entrepreneur: Entrepreneur;
  leadName: string;
  leadContact: string;
}) {
  await dispatch(
    "email",
    entrepreneur.email,
    `Nouveau prospect intéressé via ton assistant : ${leadName} (${leadContact}).\n\nIl/elle n'a pas encore réservé — pense à le/la recontacter.`
  );
}
