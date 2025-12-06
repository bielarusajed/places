CREATE TYPE "forms_types" AS ENUM('main', 'alias', 'transliteration', 'russian', 'paradigm');--> statement-breakpoint
CREATE TYPE "gender" AS ENUM('m', 'f', 'n', 'p');--> statement-breakpoint
CREATE TYPE "locality_type" AS ENUM('agrotown', 'village', 'city', 'urban_settlement', 'resort_settlement', 'townlet', 'settlement', 'worker_settlement', 'siding', 'selo', 'station', 'farmstead');--> statement-breakpoint
CREATE TABLE "forms" (
	"id" serial PRIMARY KEY,
	"place_id" integer,
	"type" "forms_types" NOT NULL,
	"paradigm_variant" text,
	"paradigm_tag" varchar(3),
	"gender" "gender",
	"stress_indexes" integer[] DEFAULT '{}'::integer[],
	"form" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" serial PRIMARY KEY,
	"region" text NOT NULL,
	"district" text,
	"council" text,
	"type" "locality_type" NOT NULL,
	"name" text NOT NULL,
	"coordinates" geography(point,4326),
	"osm_id" bigint
);
--> statement-breakpoint
CREATE INDEX "idx_forms_form_trgm" ON "forms" USING gin ("form" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_forms_place_id" ON "forms" ("place_id");--> statement-breakpoint
CREATE INDEX "idx_settlements_name_trgm" ON "places" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_settlements_coords" ON "places" USING gist ("coordinates");--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_place_id_places_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id");