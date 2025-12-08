--- BEGIN of patch: Вынішчы ---
WITH place_update AS (
	UPDATE places
	SET name = 'Вы́нішчы'
	WHERE name = 'Вы́нісцы'
	RETURNING id
),
existing_forms_update AS (
	UPDATE forms
	SET form = CASE
			type
			WHEN 'main' THEN 'Вынішчы'
			WHEN 'transliteration' THEN 'Vyniščy'
			WHEN 'russian' THEN 'Вынищи'
			WHEN 'alias' THEN 'Вынісцы'
			ELSE form
		END
	FROM place_update
	WHERE forms.place_id = place_update.id
		AND forms.type IN ('main', 'transliteration', 'russian', 'alias')
)
INSERT INTO "public"."forms" (
		"place_id",
		"type",
		"paradigm_variant",
		"paradigm_tag",
		"gender",
		"stress_indexes",
		"form"
	)
SELECT place_update.id,
	'alias-ru',
	NULL,
	NULL,
	'p',
	'{1}',
	'Вынисцы'
FROM place_update;
--- END of patch: Вынішчы ---
--- BEGIN of patch: Чырвоная Слабада, Салігорскі раён ---
WITH target_place AS(
	SELECT id
	FROM places
	WHERE district = 'Салігорскі'
		AND name = 'Чырво́ная Слабада́'
)
INSERT INTO forms(
		place_id,
		type,
		paradigm_variant,
		paradigm_tag,
		gender,
		stress_indexes,
		form
	)
SELECT id,
	'alias',
	NULL,
	NULL,
	'f',
	'{1}',
	'Вызна'
FROM target_place;
--- END of patch: Чырвоная Слабада, Салігорскі раён ---