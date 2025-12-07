import type { APIRoute } from 'astro';
import { and, asc, eq, or, sql } from 'drizzle-orm';

import db, { forms, places } from '@/db';

export const prerender = false;

const PAGE_SIZE = 20;

export const GET: APIRoute = async ({ url }) => {
  // Normalize query: replace commas with spaces (common delimiter in "name, district, region" format)
  const rawQuery = url.searchParams.get('q')?.trim();
  const query = rawQuery?.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const region = url.searchParams.get('region')?.trim();
  const district = url.searchParams.get('district')?.trim();
  const cursor = url.searchParams.get('cursor');

  if (!query || query.length < 2) {
    return Response.json({ results: [], nextCursor: null });
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
  if (district) conditions.push(eq(places.district, district));

  // Match priority: 0 = exact match on form, 1 = form starts with, 2 = form contains, 3 = location match
  const matchPriority = sql<number>`CASE 
    WHEN LOWER(${forms.form}) = LOWER(${query}) THEN 0
    WHEN LOWER(${forms.form}) LIKE LOWER(${query}) || '%' THEN 1
    WHEN ${forms.form} ILIKE ${'%' + query + '%'} THEN 2
    ELSE 3
  END`;

  // Use subquery to first get distinct places with best match priority
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

  // Build cursor conditions for pagination using raw SQL
  // Cursor format: "priority:id" to maintain sort order across pages
  let cursorCondition;
  if (cursor) {
    const parts = cursor.split(':');
    // Support both new format (priority:id) and old format (id only)
    if (parts.length === 2) {
      const cursorPriority = Number(parts[0]);
      const cursorId = Number(parts[1]);
      if (!Number.isNaN(cursorPriority) && !Number.isNaN(cursorId)) {
        cursorCondition = sql`("match_priority" > ${cursorPriority} OR ("match_priority" = ${cursorPriority} AND "id" > ${cursorId}))`;
      }
    } else {
      // Fallback for old cursor format (just id)
      const cursorId = Number(cursor);
      if (!Number.isNaN(cursorId)) {
        cursorCondition = sql`"id" > ${cursorId}`;
      }
    }
  }

  const results = await db
    .select()
    .from(innerQuery)
    .where(cursorCondition)
    .orderBy(sql`"match_priority" ASC`, asc(innerQuery.id))
    .limit(PAGE_SIZE + 1);

  const hasMore = results.length > PAGE_SIZE;
  const items = hasMore ? results.slice(0, PAGE_SIZE) : results;
  const lastItem = items[items.length - 1];
  // Access match_priority via matchPriority key (drizzle uses select object key, not SQL alias)
  const lastPriority = lastItem ? (lastItem as typeof lastItem & { matchPriority: number }).matchPriority : null;
  const nextCursor = hasMore && lastItem ? `${lastPriority}:${lastItem.id}` : null;

  // Remove matchPriority from response
  const cleanItems = items.map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { matchPriority, ...rest } = row as typeof row & { matchPriority: number };
    return rest;
  });

  return Response.json({ results: cleanItems, nextCursor });
};
