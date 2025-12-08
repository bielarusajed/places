import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';

import db, { forms } from '@/db';
import type { FormType } from '@/lib/types';

export const prerender = false;

type GenderType = 'm' | 'f' | 'n' | 'p' | null;

type FormRequestBody = {
  type?: FormType;
  form?: string;
  gender?: GenderType;
  paradigmVariant?: string | null;
  paradigmTag?: string | null;
  stressIndexes?: number[];
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id || '0', 10);
    if (isNaN(id) || id <= 0) {
      return Response.json({ error: 'Няправільны ID' }, { status: 400 });
    }

    const body = (await request.json()) as FormRequestBody;
    const { type, form, gender, paradigmVariant, paradigmTag, stressIndexes } = body;

    // Check if form exists
    const existingForm = await db.query.forms.findFirst({ where: { id } });

    if (!existingForm) {
      return Response.json({ error: 'Форма не знойдзена' }, { status: 404 });
    }

    // Update form
    // Preserve paradigmVariant/paradigmTag if not provided (they're only for paradigm forms)
    await db
      .update(forms)
      .set({
        type: type || existingForm.type,
        form: form || existingForm.form,
        gender: gender || null,
        // Only update paradigmVariant/paradigmTag if explicitly provided
        paradigmVariant: paradigmVariant !== undefined ? paradigmVariant : existingForm.paradigmVariant || null,
        paradigmTag: paradigmTag !== undefined ? paradigmTag : existingForm.paradigmTag || null,
        stressIndexes: stressIndexes || [],
      })
      .where(eq(forms.id, id));

    return Response.json({ id, success: true });
  } catch (error) {
    console.error('Error updating form:', error);
    const message = error instanceof Error ? error.message : 'Памылка абнаўлення формы';
    return Response.json({ error: message }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id || '0', 10);
    if (isNaN(id) || id <= 0) {
      return Response.json({ error: 'Няправільны ID' }, { status: 400 });
    }

    // Check if form exists
    const existingForm = await db.query.forms.findFirst({
      where: { id },
    });

    if (!existingForm) {
      return Response.json({ error: 'Форма не знойдзена' }, { status: 404 });
    }

    // Delete form
    await db.delete(forms).where(eq(forms.id, id));

    return Response.json({ id, success: true });
  } catch (error) {
    console.error('Error deleting form:', error);
    const message = error instanceof Error ? error.message : 'Памылка выдалення формы';
    return Response.json({ error: message }, { status: 500 });
  }
};
