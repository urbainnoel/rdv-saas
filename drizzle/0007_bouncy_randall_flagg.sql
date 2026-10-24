ALTER TABLE "entrepreneurs" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entrepreneurs" ADD COLUMN "email_verification_token_hash" text;--> statement-breakpoint
ALTER TABLE "entrepreneurs" ADD COLUMN "email_verification_expires_at" timestamp with time zone;--> statement-breakpoint
-- Les comptes créés avant la confirmation par email restent utilisables.
UPDATE "entrepreneurs" SET "email_verified_at" = "created_at" WHERE "email_verified_at" IS NULL;
