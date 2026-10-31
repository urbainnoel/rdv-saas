CREATE TABLE "unanswered_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"entrepreneur_id" text NOT NULL,
	"question" text NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "manage_token" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "price_label" text;--> statement-breakpoint
ALTER TABLE "unanswered_questions" ADD CONSTRAINT "unanswered_questions_entrepreneur_id_entrepreneurs_id_fk" FOREIGN KEY ("entrepreneur_id") REFERENCES "public"."entrepreneurs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unanswered_questions_entrepreneur_idx" ON "unanswered_questions" USING btree ("entrepreneur_id");--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_manage_token_idx" ON "appointments" USING btree ("manage_token");