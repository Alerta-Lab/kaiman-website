CREATE TYPE "public"."content_locale" AS ENUM('es', 'en');--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "locale" "content_locale" DEFAULT 'es' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "translation_group_id" uuid;--> statement-breakpoint
UPDATE "posts" SET "translation_group_id" = "id" WHERE "translation_group_id" IS NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "translation_group_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "name_en" text;--> statement-breakpoint
DROP INDEX IF EXISTS "posts_slug_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "posts_locale_slug_idx" ON "posts" USING btree ("locale","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_group_locale_idx" ON "posts" USING btree ("translation_group_id","locale");--> statement-breakpoint
CREATE INDEX "posts_translation_group_idx" ON "posts" USING btree ("translation_group_id");
