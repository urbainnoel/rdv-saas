CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"entrepreneur_id" text NOT NULL,
	"client_id" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"google_calendar_event_id" text,
	"reminder_sent_at" timestamp with time zone,
	"confirmed_by_client_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availabilities" (
	"id" text PRIMARY KEY NOT NULL,
	"entrepreneur_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"slot_duration_minutes" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"entrepreneur_id" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"entrepreneur_id" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entrepreneurs" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"business_name" text NOT NULL,
	"slug" text NOT NULL,
	"timezone" text DEFAULT 'Africa/Conakry' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"entrepreneur_id" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"entrepreneur_id" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_slots" ADD CONSTRAINT "blocked_slots_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_entries" ADD CONSTRAINT "knowledge_base_entries_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_entrepreneur_start_idx" ON "appointments" USING btree ("entrepreneur_id","start_at");--> statement-breakpoint
CREATE INDEX "appointments_client_idx" ON "appointments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "availabilities_entrepreneur_idx" ON "availabilities" USING btree ("entrepreneur_id");--> statement-breakpoint
CREATE INDEX "blocked_slots_entrepreneur_idx" ON "blocked_slots" USING btree ("entrepreneur_id");--> statement-breakpoint
CREATE INDEX "clients_entrepreneur_idx" ON "clients" USING btree ("entrepreneur_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_entrepreneur_phone_idx" ON "clients" USING btree ("entrepreneur_id","phone");--> statement-breakpoint
CREATE UNIQUE INDEX "entrepreneurs_email_idx" ON "entrepreneurs" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "entrepreneurs_slug_idx" ON "entrepreneurs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "knowledge_base_entrepreneur_idx" ON "knowledge_base_entries" USING btree ("entrepreneur_id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_templates_entrepreneur_type_idx" ON "message_templates" USING btree ("entrepreneur_id","type");