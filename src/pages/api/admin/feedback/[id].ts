import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';

import db, { feedback } from '@/db';

export const prerender = false;

type UpdateFeedbackBody = {
  status: 'pending' | 'resolved' | 'dismissed';
};

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id || '0', 10);
    if (isNaN(id) || id <= 0) return Response.json({ error: 'Няправільны ID' }, { status: 400 });

    const body = (await request.json()) as UpdateFeedbackBody;
    const { status } = body;

    if (!status || !['pending', 'resolved', 'dismissed'].includes(status))
      return Response.json({ error: 'Няправільны статус' }, { status: 400 });

    const existingFeedback = await db.query.feedback.findFirst({ where: { id } });
    if (!existingFeedback) return Response.json({ error: 'Водгук не знойдзены' }, { status: 404 });

    await db
      .update(feedback)
      .set({ status, resolvedAt: status === 'resolved' || status === 'dismissed' ? new Date() : null })
      .where(eq(feedback.id, id));

    return Response.json({ id, success: true });
  } catch (error) {
    console.error('Error updating feedback:', error);
    const message = error instanceof Error ? error.message : 'Памылка абнаўлення водгуку';
    return Response.json({ error: message }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id || '0', 10);
    if (isNaN(id) || id <= 0) return Response.json({ error: 'Няправільны ID' }, { status: 400 });

    const existingFeedback = await db.query.feedback.findFirst({ where: { id } });
    if (!existingFeedback) return Response.json({ error: 'Водгук не знойдзены' }, { status: 404 });

    await db.delete(feedback).where(eq(feedback.id, id));

    return Response.json({ id, success: true });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    const message = error instanceof Error ? error.message : 'Памылка выдалення водгуку';
    return Response.json({ error: message }, { status: 500 });
  }
};
