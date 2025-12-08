ALTER TABLE "places"
ADD COLUMN "search_text" text;
--> statement-breakpoint
CREATE INDEX "idx_places_search_text_trgm" ON "places" USING gin ("search_text" gin_trgm_ops);
--> statement-breakpoint
-- Trigger function to rebuild search_text when forms change
CREATE OR REPLACE FUNCTION update_place_search_text() RETURNS TRIGGER AS $$
DECLARE target_place_id INTEGER;
BEGIN target_place_id := COALESCE(NEW.place_id, OLD.place_id);
UPDATE places
SET search_text = (
    SELECT COALESCE(string_agg(form, ' '), '')
    FROM forms
    WHERE place_id = target_place_id
      AND type != 'paradigm'
  ) || ' ' || COALESCE(district, '') || ' ' || region
WHERE id = target_place_id;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
-- Trigger on forms table (AFTER INSERT/UPDATE/DELETE)
CREATE TRIGGER trg_update_search_text
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON forms FOR EACH ROW EXECUTE FUNCTION update_place_search_text();
--> statement-breakpoint
-- Populate search_text for all existing places
UPDATE places p
SET search_text = (
    SELECT COALESCE(string_agg(f.form, ' '), '')
    FROM forms f
    WHERE f.place_id = p.id
      AND f.type != 'paradigm'
  ) || ' ' || COALESCE(p.district, '') || ' ' || p.region;