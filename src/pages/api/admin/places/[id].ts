import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';

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
    paradigmVariant?: string | null;
    paradigmTag?: string | null;
  }>;
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id || '0', 10);
    if (isNaN(id) || id <= 0) {
      return Response.json({ error: 'Няправільны ID' }, { status: 400 });
    }

    const body = (await request.json()) as PlaceRequestBody;
    const { name, type, region, district, council, osmId, coordinates, forms: formsData } = body;

    // Validate required fields
    if (!name || !type || !region) {
      return Response.json({ error: 'Назва, тып і вобласць абавязковыя' }, { status: 400 });
    }

    // Check if place exists
    const existingPlace = await db.query.places.findFirst({
      where: { id },
    });

    if (!existingPlace) {
      return Response.json({ error: 'Населены пункт не знойдзены' }, { status: 404 });
    }

    // Update place
    await db
      .update(places)
      .set({
        name,
        type,
        region,
        district: district || null,
        council: council || null,
        osmId: osmId || null,
        coordinates: coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : null,
      })
      .where(eq(places.id, id));

    // Get existing forms
    const existingForms = await db.query.forms.findMany({
      where: { placeId: id },
    });

    // Build a map of existing forms by ID for quick lookup
    const existingById = new Map(existingForms.map((f) => [f.id, f]));

    const existingFormIds = new Set(existingForms.map((f) => f.id));
    const submittedFormIds = new Set(
      (formsData || []).map((f) => f.id).filter((formId): formId is number => typeof formId === 'number'),
    );

    // Delete forms that are not in the submitted list, but exclude paradigm forms
    const formsToDelete = existingForms.filter((f) => !submittedFormIds.has(f.id) && f.type !== 'paradigm');
    if (formsToDelete.length > 0) {
      const idsToDelete = formsToDelete.map((f) => f.id);
      // Delete one by one (drizzle doesn't support IN with array directly in this context)
      for (const formId of idsToDelete) {
        await db.delete(forms).where(eq(forms.id, formId));
      }
    }

    // Update or insert forms (skip paradigm forms - they should not be created/updated via this endpoint)
    if (formsData && Array.isArray(formsData)) {
      for (const formData of formsData) {
        // Ignore paradigm forms - they should not be managed via this endpoint
        if (formData.type === 'paradigm') {
          continue;
        }

        if (formData.id && existingFormIds.has(formData.id)) {
          // Update existing form
          // Preserve paradigmVariant/paradigmTag if not provided (they're only for paradigm forms)
          const existing = existingById.get(formData.id);
          await db
            .update(forms)
            .set({
              type: formData.type,
              form: formData.form,
              gender: formData.gender || null,
              // Only update paradigmVariant/paradigmTag if explicitly provided
              paradigmVariant:
                formData.paradigmVariant !== undefined ? formData.paradigmVariant : existing?.paradigmVariant || null,
              paradigmTag: formData.paradigmTag !== undefined ? formData.paradigmTag : existing?.paradigmTag || null,
              stressIndexes: formData.stressIndexes || [],
            })
            .where(eq(forms.id, formData.id));
        } else {
          // Insert new form (non-paradigm forms don't need paradigmVariant/paradigmTag)
          await db.insert(forms).values({
            placeId: id,
            type: formData.type,
            form: formData.form,
            gender: formData.gender || null,
            stressIndexes: formData.stressIndexes || [],
          });
        }
      }
    }

    return Response.json({ id, success: true });
  } catch (error) {
    console.error('Error updating place:', error);
    const message = error instanceof Error ? error.message : 'Памылка абнаўлення населенага пункта';
    return Response.json({ error: message }, { status: 500 });
  }
};
