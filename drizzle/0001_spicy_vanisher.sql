CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"entrepreneur_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration_minutes" integer,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "service_id" text;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "services_entrepreneur_idx" ON "services" USING btree ("entrepreneur_id");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;