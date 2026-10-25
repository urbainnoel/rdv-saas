// Envoi des notifications (email + WhatsApp) aux clients et entrepreneurs.
// Email : branché sur Resend (gratuit). WhatsApp : toujours un log en
// attendant un compte Meta Business vérifié (hors scope pour l'instant).
//
// Important à savoir sur Resend sans domaine vérifié : l'expéditeur
// "onboarding@resend.dev" ne peut envoyer QUE vers l'adresse e-mail du
// compte Resend lui-même (mode test anti-spam de Resend). Donc pour
// l'instant, seules les notifications vers l'ENTREPRENEUR fonctionnent
// réellement si son email de notification correspond au compte Resend ;
// les emails vers ses CLIENTS (adresses arbitraires) resteront en échec
// silencieux (on logue l'erreur) jusqu'à ce qu'un nom de domaine soit
// vérifié sur resend.com/domains.

import { schema } from "@/db";
import { DEFAULT_MESSAGE_TEMPLATES, MessageTemplateType } from "./enums";

type Entrepreneur = typeof schema.entrepreneurs.$inferSelect;
type Client = typeof schema.clients.$inferSelect;
type Appointment = typeof schema.appointments.$inferSelect;

// Une fois un domaine vérifié sur Resend, définir RESEND_FROM dans Vercel,
// ex. "RDV Assistant <notifications@mondomaine.com>".
const RESEND_FROM = process.env.RESEND_FROM?.trim() || "RDV Assistant <onboarding@resend.dev>";

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

function notificationEmailFor(entrepreneur: Entrepreneur): string {
  return entrepreneur.notificationEmail || entrepreneur.email;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callResend(apiKey: string, to: string, subject: string, message: string) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to,
      subject,
      text: message,
    }),
  });
}

export async function sendEmail(to: string, subject: string, message: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.log(`[NOTIFICATION:EMAIL] (Resend non configuré) -> ${to}\n${subject}\n${message}\n`);
    return;
  }

  // Jusqu'à 2 tentatives : les fonctions serverless ont parfois une coupure
  // réseau ponctuelle (TLS/connexion) lors du premier appel sortant — on ne
  // veut pas perdre une vraie notification pour un blip passager.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await callResend(apiKey, to, subject, message);
      if (res.ok) return;

      const text = await res.text().catch(() => "");
      // Cas attendu sans domaine vérifié : Resend refuse d'envoyer à une
      // adresse qui n'est pas celle du compte. Pas la peine de réessayer,
      // le résultat sera le même — on logue et on arrête là.
      console.error(`[Resend] Échec envoi à ${to} (HTTP ${res.status}): ${text.slice(0, 300)}`);
      return;
    } catch (err) {
      console.error(`[Resend] Erreur réseau (tentative ${attempt}/2) vers ${to}:`, err);
      if (attempt === 1) await sleep(400);
    }
  }
}

async function dispatch(channel: "email" | "whatsapp", to: string | null, subject: string, message: string) {
  if (!to) return;
  if (channel === "email") {
    await sendEmail(to, subject, message);
  } else {
    // TODO: brancher l'API WhatsApp Business ici une fois le compte Meta prêt.
    console.log(`[NOTIFICATION:WHATSAPP] (non branché) -> ${to}\n${message}\n`);
  }
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

  await dispatch("email", client.email, `Rendez-vous confirmé avec ${entrepreneur.businessName}`, message);
  await dispatch("whatsapp", client.phone, "", message);

  await dispatch(
    "email",
    notificationEmailFor(entrepreneur),
    "Nouveau rendez-vous réservé",
    `${client.fullName} vient de réserver un créneau le ${vars.date} à ${vars.heure}.`
  );
}

export async function sendReminder({
  entrepreneur,
  client,
  appointment,
  type,
  template,
}: {
  entrepreneur: Entrepreneur;
  client: Client;
  appointment: Appointment;
  type: Extract<MessageTemplateType, "REMINDER_24H" | "REMINDER_1H">;
  /** Texte personnalisé par l'entrepreneur ; à défaut, le modèle par défaut. */
  template?: string;
}) {
  const vars = buildVars(entrepreneur, client, appointment);
  const message = formatMessage(template ?? DEFAULT_MESSAGE_TEMPLATES[type], vars);

  await dispatch("email", client.email, `Rappel de votre rendez-vous — ${entrepreneur.businessName}`, message);
  await dispatch("whatsapp", client.phone, "", message);

  // Notifier aussi l'entrepreneur lui-même (rappel bidirectionnel)
  await dispatch(
    "email",
    notificationEmailFor(entrepreneur),
    "Rappel de rendez-vous",
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
    notificationEmailFor(entrepreneur),
    "Une question sans réponse sur ton assistant",
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
    notificationEmailFor(entrepreneur),
    "Nouveau prospect via ton assistant",
    `Nouveau prospect intéressé via ton assistant : ${leadName} (${leadContact}).\n\nIl/elle n'a pas encore réservé — pense à le/la recontacter. Tu retrouves tous tes prospects dans ton tableau de bord, rubrique « Prospects ».`
  );
}

// Annulation d'un RDV par l'entrepreneur : on prévient le client.
export async function sendCancellationNotice({
  entrepreneur,
  client,
  appointment,
}: {
  entrepreneur: Entrepreneur;
  client: Client;
  appointment: Appointment;
}) {
  const vars = buildVars(entrepreneur, client, appointment);
  const message = `Bonjour ${vars.prenom_client}, votre rendez-vous avec ${entrepreneur.businessName} du ${vars.date} à ${vars.heure} est annulé. Vous pouvez reprendre un créneau quand vous le souhaitez.`;
  await dispatch("email", client.email, `Rendez-vous annulé — ${entrepreneur.businessName}`, message);
  await dispatch("whatsapp", client.phone, "", message);
}

// Report d'un RDV par l'entrepreneur : on donne au client le nouvel horaire.
export async function sendRescheduleNotice({
  entrepreneur,
  client,
  appointment,
  previousStart,
}: {
  entrepreneur: Entrepreneur;
  client: Client;
  appointment: Appointment;
  previousStart: Date;
}) {
  const vars = buildVars(entrepreneur, client, appointment);
  const before = previousStart.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const message = `Bonjour ${vars.prenom_client}, votre rendez-vous avec ${entrepreneur.businessName} prévu le ${before} est déplacé au ${vars.date} à ${vars.heure}. À bientôt !`;
  await dispatch("email", client.email, `Rendez-vous déplacé — ${entrepreneur.businessName}`, message);
  await dispatch("whatsapp", client.phone, "", message);
}
