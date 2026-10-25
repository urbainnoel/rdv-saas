ALTER TABLE "entrepreneurs" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "entrepreneurs" ADD COLUMN "google_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "entrepreneurs_google_id_idx" ON "entrepreneurs" USING btree ("google_id");