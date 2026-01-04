CREATE TYPE "feedback_status" AS ENUM('pending', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY,
	"place_id" integer NOT NULL,
	"message" text NOT NULL,
	"status" "feedback_status" DEFAULT 'pending'::"feedback_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_place_id_places_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE;