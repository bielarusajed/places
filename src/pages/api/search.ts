import type { APIRoute } from 'astro';
import { eq, ilike, sql } from 'drizzle-orm';

import db, { forms, places } from '@/db';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return Response.json([]);
  }

  const results = await db
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
      )`,
      russian: sql<string | null>`(
        SELECT f.form FROM forms f 
        WHERE f.place_id = ${places.id} AND f.type = 'russian' 
        LIMIT 1
      )`,
    })
    .from(forms)
    .innerJoin(places, eq(forms.placeId, places.id))
    .where(ilike(forms.form, `%${query}%`))
    .orderBy(places.id)
    .limit(20);

  return Response.json(results);
};
