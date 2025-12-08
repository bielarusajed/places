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

  // Check if query is a numeric ID
  const queryAsId = /^\d+$/.test(query) ? Number(query) : null;

  // Build cursor condition
  let cursorCondition = sql`TRUE`;
  if (cursor) {
    const parts = cursor.split(':');
    if (parts.length === 2) {
      const cursorPriority = Number(parts[0]);
      const cursorId = Number(parts[1]);
      if (!Number.isNaN(cursorPriority) && !Number.isNaN(cursorId)) {
        cursorCondition = sql`(match_priority > ${cursorPriority} OR (match_priority = ${cursorPriority} AND p.id > ${cursorId}))`;
      }
    } else {
      const cursorId = Number(cursor);
      if (!Number.isNaN(cursorId)) {
        cursorCondition = sql`p.id > ${cursorId}`;
      }
    }
  }

  // Build region/district filters
  const regionFilter = region ? sql`AND p.region = ${region}` : sql``;
  const districtFilter = district ? sql`AND p.district = ${district}` : sql``;

  // Build word-by-word search condition: each word must match somewhere in search_text
  const queryWords = queryLower.split(/\s+/).filter(Boolean);
  const wordConditions = queryWords.map((word) => sql`LOWER(p.search_text) LIKE ${'%' + word + '%'}`);
  const allWordsMatch = wordConditions.length > 0 ? sql.join(wordConditions, sql` AND `) : sql`TRUE`;

  // Build search condition: ID match OR all words match
  const idCondition = queryAsId ? sql`p.id = ${queryAsId}` : sql`FALSE`;
  const textCondition = allWordsMatch;

  // Simplified query using denormalized search_text column
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
    SELECT 
      p.id as place_id,
      p.name,
      p.type,
      p.region,
      p.district,
      p.council,
      (SELECT form FROM forms WHERE place_id = p.id AND type = 'transliteration' LIMIT 1) as transliteration,
      (SELECT form FROM forms WHERE place_id = p.id AND type = 'russian' LIMIT 1) as russian,
      CASE 
        WHEN p.id = ${queryAsId ?? -1} THEN 0
        WHEN LOWER(p.name) = ${queryWords[0] ?? ''} THEN 1
        WHEN LOWER(p.name) LIKE ${(queryWords[0] ?? '') + '%'} THEN 2
        ELSE 3
      END as match_priority
    FROM places p
    WHERE (${idCondition} OR ${textCondition})
      ${regionFilter}
      ${districtFilter}
      AND ${cursorCondition}
    ORDER BY match_priority, p.id
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
