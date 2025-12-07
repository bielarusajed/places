import type { APIRoute } from 'astro';
import { and, asc, eq, ilike, sql } from 'drizzle-orm';

import db, { forms, places } from '@/db';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q')?.trim();
  const region = url.searchParams.get('region')?.trim();

  if (!query || query.length < 2) {
    return Response.json([]);
  }

  const conditions = [ilike(forms.form, `%${query}%`)];

  if (region) conditions.push(eq(places.region, region));

  // Match priority: 0 = exact match, 1 = starts with, 2 = contains
  const matchPriority = sql<number>`CASE 
    WHEN LOWER(${forms.form}) = LOWER(${query}) THEN 0
    WHEN LOWER(${forms.form}) LIKE LOWER(${query}) || '%' THEN 1
    ELSE 2
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
