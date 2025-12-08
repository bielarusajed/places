import type { APIRoute } from 'astro';

import db, { forms, places } from '@/db';
import type { FormType, LocalityType } from '@/lib/types';

export const prerender = false;

type GenderType = 'm' | 'f' | 'n' | 'p' | null;

type PlaceRequestBody = {
  name: string;
  type: LocalityType;
  region: string;
  district?: string | null;
  council?: string | null;
  osmId?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  forms?: Array<{
    id?: number;
    type: FormType;
    form: string;
    gender?: GenderType;
    stressIndexes?: number[];
  }>;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as PlaceRequestBody;
    const { name, type, region, district, council, osmId, coordinates, forms: formsData } = body;

    // Validate required fields
    if (!name || !type || !region) {
      return Response.json({ error: 'Назва, тып і вобласць абавязковыя' }, { status: 400 });
    }

    // Insert place
    const [place] = await db
      .insert(places)
      .values({
        name,
        type,
        region,
        district: district || null,
        council: council || null,
        osmId: osmId || null,
        coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : null,
      })
      .returning();

    // Insert forms if provided (filter out paradigm forms - they should not be created via this endpoint)
    if (formsData && formsData.length > 0) {
      const nonParadigmForms = formsData.filter((f) => f.type !== 'paradigm');
      if (nonParadigmForms.length > 0) {
        await db.insert(forms).values(
          nonParadigmForms.map((f) => ({
            placeId: place.id,
            type: f.type,
            form: f.form,
            gender: f.gender || null,
            stressIndexes: f.stressIndexes || [],
          })),
        );
      }
    }

    return Response.json({ id: place.id, success: true });
  } catch (error) {
    console.error('Error creating place:', error);
    const message = error instanceof Error ? error.message : 'Памылка стварэння населенага пункта';
    return Response.json({ error: message }, { status: 500 });
  }
};
