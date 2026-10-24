// Schéma de base de données — SaaS de prise de RDV + assistant pour entrepreneurs
// ORM : Drizzle + PostgreSQL (hébergé sur Neon)

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

const id = () => text("id").primaryKey().$defaultFn(() => createId());
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
};

// ----------------------------------------------------------------------------
// ENTREPRENEUR — le client payant de notre SaaS
// ----------------------------------------------------------------------------
export const entrepreneurs = pgTable(
  "entrepreneurs",
  {
    id: id(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    businessName: text("business_name").notNull(),
    slug: text("slug").notNull(), // utilisé dans l'URL publique : tonapp.com/{slug}
    timezone: text("timezone").notNull().default("Africa/Conakry"),
    // Couleur de marque de l'entrepreneur (hex, ex: "#1f4d3d"), appliquée à sa
    // page publique, à l'embed et à la bulle du widget. null = couleur par
    // défaut de l'app (vert forêt).
    brandColor: text("brand_color"),
    // Logo de l'entreprise, stocké directement en data URL (base64) — pas de
    // service de stockage externe nécessaire, l'image est redimensionnée et
    // compressée côté client avant l'envoi pour rester légère.
    logoUrl: text("logo_url"),
    // Adresse qui reçoit les notifications liées aux RDV (confirmations,
    // rappels, prospects, questions sans réponse) — distincte de l'email de
    // connexion si l'entrepreneur préfère recevoir ça ailleurs. null = on
    // utilise l'email de connexion par défaut.
    notificationEmail: text("notification_email"),
    ...timestamps,
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    emailIdx: uniqueIndex("entrepreneurs_email_idx").on(table.email),
    slugIdx: uniqueIndex("entrepreneurs_slug_idx").on(table.slug),
  })
);

// ----------------------------------------------------------------------------
// DISPONIBILITÉS — règles récurrentes ("tous les lundis de 9h à 17h")
// ----------------------------------------------------------------------------
export const availabilities = pgTable(
  "availabilities",
  {
    id: id(),
    entrepreneurId: text("entrepreneur_id")
      .notNull()
      .references(() => entrepreneurs.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0 = dimanche ... 6 = samedi
    startTime: text("start_time").notNull(), // "09:00"
    endTime: text("end_time").notNull(), // "17:00"
    slotDurationMinutes: integer("slot_duration_minutes").notNull().default(30),
    ...timestamps,
  },
  (table) => ({
    entrepreneurIdx: index("availabilities_entrepreneur_idx").on(
      table.entrepreneurId
    ),
  })
);

// Créneaux bloqués ponctuellement (congés, imprévu...)
export const blockedSlots = pgTable(
  "blocked_slots",
  {
    id: id(),
    entrepreneurId: text("entrepreneur_id")
      .notNull()
      .references(() => entrepreneurs.id, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    reason: text("reason"),
  },
  (table) => ({
    entrepreneurIdx: index("blocked_slots_entrepreneur_idx").on(
      table.entrepreneurId
    ),
  })
);

// ----------------------------------------------------------------------------
// CLIENT — la personne qui prend rendez-vous (pas un utilisateur du SaaS)
// ----------------------------------------------------------------------------
export const clients = pgTable(
  "clients",
  {
    id: id(),
    entrepreneurId: text("entrepreneur_id")
      .notNull()
      .references(() => entrepreneurs.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    email: text("email"),
    phone: text("phone"), // format E.164 pour WhatsApp
    ...timestamps,
  },
  (table) => ({
    entrepreneurIdx: index("clients_entrepreneur_idx").on(table.entrepreneurId),
    entrepreneurPhoneIdx: uniqueIndex("clients_entrepreneur_phone_idx").on(
      table.entrepreneurId,
      table.phone
    ),
  })
);

// ----------------------------------------------------------------------------
// SERVICES — ce que le client peut choisir au moment de réserver
// ("Consultation 30 min", "Suivi mensuel"...), défini par l'entrepreneur
// ----------------------------------------------------------------------------
export const services = pgTable(
  "services",
  {
    id: id(),
    entrepreneurId: text("entrepreneur_id")
      .notNull()
      .references(() => entrepreneurs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes"),
    archived: boolean("archived").notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    entrepreneurIdx: index("services_entrepreneur_idx").on(table.entrepreneurId),
  })
);

// ----------------------------------------------------------------------------
// RENDEZ-VOUS
// ----------------------------------------------------------------------------
// status: PENDING | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW (voir src/lib/enums.ts)
export const appointments = pgTable(
  "appointments",
  {
    id: id(),
    entrepreneurId: text("entrepreneur_id")
      .notNull()
      .references(() => entrepreneurs.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    serviceId: text("service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("PENDING"),
    notes: text("notes"),
    googleCalendarEventId: text("google_calendar_event_id"),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    // Marqueurs posés par la tâche planifiée des rappels : chaque rappel
    // n'est envoyé qu'une fois, même si la tâche tourne plusieurs fois.
    reminder24hSentAt: timestamp("reminder_24h_sent_at", { withTimezone: true }),
    reminder1hSentAt: timestamp("reminder_1h_sent_at", { withTimezone: true }),
    confirmedByClientAt: timestamp("confirmed_by_client_at", { withTimezone: true }),
    ...timestamps,
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    entrepreneurStartIdx: index("appointments_entrepreneur_start_idx").on(
      table.entrepreneurId,
      table.startAt
    ),
    clientIdx: index("appointments_client_idx").on(table.clientId),
  })
);

// ----------------------------------------------------------------------------
// TEMPLATES DE MESSAGES — préfaits, modifiables par l'entrepreneur
// ----------------------------------------------------------------------------
// type: CONFIRMATION | REMINDER_24H | REMINDER_1H | THANK_YOU
//       | NO_SHOW_FOLLOWUP | INACTIVE_CLIENT | REVIEW_REQUEST (voir src/lib/enums.ts)
export const messageTemplates = pgTable(
  "message_templates",
  {
    id: id(),
    entrepreneurId: text("entrepreneur_id")
      .notNull()
      .references(() => entrepreneurs.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    content: text("content").notNull(), // supporte {prenom_client}, {date}, {heure}, {nom_entrepreneur}
    enabled: boolean("enabled").notNull().default(true),
  },
  (table) => ({
    entrepreneurTypeIdx: uniqueIndex("message_templates_entrepreneur_type_idx").on(
      table.entrepreneurId,
      table.type
    ),
  })
);

// ----------------------------------------------------------------------------
// BASE DE CONNAISSANCE DU CHATBOT — FAQ / infos fournies par l'entrepreneur
// ----------------------------------------------------------------------------
export const knowledgeBaseEntries = pgTable(
  "knowledge_base_entries",
  {
    id: id(),
    entrepreneurId: text("entrepreneur_id")
      .notNull()
      .references(() => entrepreneurs.id, { onDelete: "cascade" }),
    // "faq" (question/réponse classique), "info" (doc libre sur l'entreprise :
    // présentation, politique d'annulation, zone d'intervention...), ou
    // "logic" (consigne de comportement : comment réagir dans telle situation).
    type: text("type").notNull().default("faq"),
    question: text("question").notNull(), // question, OU titre si type != "faq"
    answer: text("answer").notNull(), // réponse, OU contenu si type != "faq"
    ...timestamps,
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    entrepreneurIdx: index("knowledge_base_entrepreneur_idx").on(
      table.entrepreneurId
    ),
  })
);

// ----------------------------------------------------------------------------
// LIMITES D'UTILISATION — compteurs par fenêtre de temps (anti-abus)
// ----------------------------------------------------------------------------
// key : ex. "chat:ip:1.2.3.4" ou "login:email:x@y.com". Nettoyée
// régulièrement par la tâche planifiée des rappels.
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});
