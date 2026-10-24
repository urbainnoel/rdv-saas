CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"entrepreneur_id" text NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"context" text,
	"status" text DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "leads_entrepreneur_contact_idx" ON "leads" USING btree ("entrepreneur_id","contact");