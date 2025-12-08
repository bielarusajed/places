import type { APIRoute } from 'astro';
import { sql } from 'drizzle-orm';

import db from '@/db';

export const prerender = false;

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const GET: APIRoute = async ({ url }) => {
  // Normalize query: replace commas with spaces (common delimiter in "name, district, region" format)
  const rawQuery = url.searchParams.get('q')?.trim();
  const query = rawQuery?.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const region = url.searchParams.get('region')?.trim();
  const district = url.searchParams.get('district')?.trim();
  const cursor = url.searchParams.get('cursor');
  const pageSizeParam = url.searchParams.get('pageSize');

  // Parse and clamp pageSize
  const pageSize = pageSizeParam
    ? Math.min(Math.max(1, Number(pageSizeParam) || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  if (!query || query.length < 2) {
    return Response.json({ results: [], nextCursor: null });
  }

  const queryLower = query.toLowerCase();

  // Build cursor condition
  let cursorCondition = sql`TRUE`;
  if (cursor) {
    const parts = cursor.split(':');
    if (parts.length === 2) {
      const cursorPriority = Number(parts[0]);
      const cursorId = Number(parts[1]);
      if (!Number.isNaN(cursorPriority) && !Number.isNaN(cursorId)) {
        cursorCondition = sql`(match_priority > ${cursorPriority} OR (match_priority = ${cursorPriority} AND place_id > ${cursorId}))`;
      }
    } else {
      const cursorId = Number(cursor);
      if (!Number.isNaN(cursorId)) {
        cursorCondition = sql`place_id > ${cursorId}`;
      }
    }
  }

  // Build region/district filters
  const regionFilter = region ? sql`AND p.region = ${region}` : sql``;
  const districtFilter = district ? sql`AND p.district = ${district}` : sql``;

  // Build word match conditions for combined location search
  const queryWords = queryLower.split(/\s+/).filter(Boolean);
  const wordConditions = queryWords.map((word) => sql`combined_loc LIKE ${'%' + word + '%'}`);
  const allWordsMatch = sql.join(wordConditions, sql` AND `);

  // Single optimized query using CTEs for better performance
  // 1. First CTE finds matching place IDs with their best match priority
  // 2. Second CTE aggregates form data (transliteration, russian) per place
  // 3. Final query joins everything together
  const results = await db.execute<{
    place_id: number;
    name: string;
    type: string;
    region: string;
    district: string | null;
    council: string | null;
    transliteration: string | null;
    russian: string | null;
    match_priority: number;
  }>(sql`
    WITH matching_places AS (
      SELECT DISTINCT ON (p.id)
        p.id as place_id,
        CASE 
          WHEN LOWER(f.form) = ${queryLower} THEN 0
          WHEN LOWER(f.form) LIKE ${queryLower + '%'} THEN 1
          WHEN f.form ILIKE ${'%' + query + '%'} THEN 2
          ELSE 3
        END as match_priority
      FROM forms f
      INNER JOIN places p ON f.place_id = p.id
      WHERE (
        f.form ILIKE ${'%' + query + '%'}
        OR EXISTS (
          SELECT 1 FROM (
            SELECT LOWER(
              COALESCE((SELECT form FROM forms WHERE place_id = p.id AND type = 'main' LIMIT 1), p.name)
              || ' ' || COALESCE(p.district, '') 
              || ' ' || p.region
            ) as combined_loc
          ) loc WHERE ${allWordsMatch}
        )
      )
      ${regionFilter}
      ${districtFilter}
      ORDER BY p.id, match_priority
    ),
    form_data AS (
      SELECT 
        place_id,
        MAX(CASE WHEN type = 'transliteration' THEN form END) as transliteration,
        MAX(CASE WHEN type = 'russian' THEN form END) as russian
      FROM forms
      WHERE place_id IN (SELECT place_id FROM matching_places)
        AND type IN ('transliteration', 'russian')
      GROUP BY place_id
    )
    SELECT 
      mp.place_id,
      p.name,
      p.type,
      p.region,
      p.district,
      p.council,
      fd.transliteration,
      fd.russian,
      mp.match_priority
    FROM matching_places mp
    INNER JOIN places p ON mp.place_id = p.id
    LEFT JOIN form_data fd ON mp.place_id = fd.place_id
    WHERE ${cursorCondition}
    ORDER BY mp.match_priority, mp.place_id
    LIMIT ${pageSize + 1}
  `);

  const hasMore = results.rows.length > pageSize;
  const items = hasMore ? results.rows.slice(0, pageSize) : results.rows;
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? `${lastItem.match_priority}:${lastItem.place_id}` : null;

  // Transform results to expected format
  const cleanItems = items.map((row) => ({
    id: row.place_id,
    name: row.name,
    type: row.type,
    region: row.region,
    district: row.district,
    council: row.council,
    transliteration: row.transliteration,
    russian: row.russian,
  }));

  return Response.json({ results: cleanItems, nextCursor });
};
