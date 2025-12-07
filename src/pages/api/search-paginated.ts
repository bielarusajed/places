import type { APIRoute } from 'astro';
import { and, eq, gt, ilike, sql } from 'drizzle-orm';

import db, { forms, places } from '@/db';

export const prerender = false;

const PAGE_SIZE = 20;

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q')?.trim();
  const region = url.searchParams.get('region')?.trim();
  const district = url.searchParams.get('district')?.trim();
  const cursor = url.searchParams.get('cursor');

  if (!query || query.length < 2) {
    return Response.json({ results: [], nextCursor: null });
  }

  const conditions = [ilike(forms.form, `%${query}%`)];

  if (region) conditions.push(eq(places.region, region));
  if (district) conditions.push(eq(places.district, district));
  if (cursor) conditions.push(gt(places.id, Number(cursor)));

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
    .where(and(...conditions))
    .orderBy(places.id)
    .limit(PAGE_SIZE + 1);

  const hasMore = results.length > PAGE_SIZE;
  const items = hasMore ? results.slice(0, PAGE_SIZE) : results;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return Response.json({ results: items, nextCursor });
};
