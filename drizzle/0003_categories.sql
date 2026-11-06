CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "category_id" uuid;
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_category_idx" ON "posts" USING btree ("category_id");
--> statement-breakpoint
INSERT INTO "categories" ("name", "name_en", "slug") VALUES
	('Restaurantes', 'Restaurants', 'restaurantes'),
	('Med spas y estética', 'Med spas & aesthetics', 'med-spas-y-estetica'),
	('Salones de belleza y uñas', 'Beauty & nail salons', 'salones-de-belleza-y-unas'),
	('Bufetes de abogados', 'Law firms', 'bufetes-de-abogados'),
	('Inmobiliarias', 'Real estate', 'inmobiliarias'),
	('Agencias de marketing', 'Marketing agencies', 'agencias-de-marketing')
ON CONFLICT ("slug") DO NOTHING;
