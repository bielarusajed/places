import type { APIRoute } from 'astro';
import { and, asc, eq, or, sql } from 'drizzle-orm';

import db, { forms, places } from '@/db';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  // Normalize query: replace commas with spaces (common delimiter in "name, district, region" format)
  const rawQuery = url.searchParams.get('q')?.trim();
  const query = rawQuery?.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const region = url.searchParams.get('region')?.trim();

  if (!query || query.length < 2) {
    return Response.json([]);
  }

  // Combined location string for fuzzy search using main form (without stress marks): "main_form district region"
  // places.name has stress marks, so we use a subquery to get the plain form
  const mainForm = sql`COALESCE((SELECT f.form FROM forms f WHERE f.place_id = ${places.id} AND f.type = 'main' LIMIT 1), ${places.name})`;
  const combinedLocation = sql`LOWER(${mainForm} || ' ' || COALESCE(${places.district}, '') || ' ' || ${places.region})`;

  // Split query into words and check if ALL words appear in combined location
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const allWordsMatchConditions = queryWords.map((word) => sql`${combinedLocation} LIKE ${'%' + word + '%'}`);
  const allWordsMatch =
    queryWords.length > 1 ? sql`(${sql.join(allWordsMatchConditions, sql` AND `)})` : allWordsMatchConditions[0];

  // Search in forms.form OR all words from query match in combined location
  const searchCondition = or(sql`${forms.form} ILIKE ${'%' + query + '%'}`, allWordsMatch);

  const conditions = [searchCondition];
  if (region) conditions.push(eq(places.region, region));

  // Match priority: 0 = exact match on form, 1 = form starts with, 2 = form contains, 3 = location match
  const matchPriority = sql<number>`CASE 
    WHEN LOWER(${forms.form}) = LOWER(${query}) THEN 0
    WHEN LOWER(${forms.form}) LIKE LOWER(${query}) || '%' THEN 1
    WHEN ${forms.form} ILIKE ${'%' + query + '%'} THEN 2
    ELSE 3
  END`;

  // Use subquery to first get distinct places with best match priority,
  // then order final results by priority
  const innerQuery = db
    .selectDistinctOn([places.id], {
      id: places.id,
      name: places.name,
      type: places.type,
      region: places.region,
      district: places.district,
      council: places.council,
      transliteration: sql<string | null>`(
        SELECT f.form FROM forms f 
        WHERE f.place_id = ${places.id} AND f.type = 'transliteration' 
        LIMIT 1
      )`
        .mapWith(String)
        .as('transliteration'),
      russian: sql<string | null>`(
        SELECT f.form FROM forms f 
        WHERE f.place_id = ${places.id} AND f.type = 'russian' 
        LIMIT 1
      )`
        .mapWith(String)
        .as('russian'),
      matchPriority: matchPriority.as('match_priority'),
    })
    .from(forms)
    .innerJoin(places, eq(forms.placeId, places.id))
    .where(and(...conditions))
    .orderBy(places.id, asc(matchPriority))
    .as('inner_query');

  const results = await db
    .select()
    .from(innerQuery)
    .orderBy(sql`"match_priority" ASC`, asc(innerQuery.id))
    .limit(40);

  // Remove matchPriority from response
  const cleanResults = results.map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { matchPriority, ...rest } = row as typeof row & { matchPriority: number };
    return rest;
  });

  return Response.json(cleanResults);
};
