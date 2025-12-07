import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';

import db, { places } from '@/db';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const region = url.searchParams.get('region')?.trim();

  if (!region) {
    return Response.json([]);
  }

  const results = await db
    .selectDistinct({ district: places.district })
    .from(places)
    .where(eq(places.region, region))
    .orderBy(places.district);

  const districts = results.map((r) => r.district).filter((d): d is string => d !== null);

  return Response.json(districts);
};
