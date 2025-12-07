import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';

import db, { forms, places } from '@/db';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = Number(params.id);

  if (isNaN(id)) {
    return new Response('Invalid ID', { status: 400 });
  }

  const place = await db.select().from(places).where(eq(places.id, id)).limit(1);

  if (place.length === 0) {
    return new Response('Not found', { status: 404 });
  }

  const placeForms = await db
    .select({
      id: forms.id,
      type: forms.type,
      form: forms.form,
      gender: forms.gender,
      stressIndexes: forms.stressIndexes,
      paradigmVariant: forms.paradigmVariant,
      paradigmTag: forms.paradigmTag,
    })
    .from(forms)
    .where(eq(forms.placeId, id));

  return Response.json({
    ...place[0],
    forms: placeForms,
  });
};
