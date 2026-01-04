import type { APIRoute } from 'astro';

import db, { feedback } from '@/db';

export const prerender = false;

type FeedbackRequestBody = {
  placeId: number;
  message: string;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as FeedbackRequestBody;
    const { placeId, message } = body;

    // Validate required fields
    if (!placeId || typeof placeId !== 'number')
      return Response.json({ error: 'Няверны ID населенага пункта' }, { status: 400 });

    if (!message || typeof message !== 'string' || message.trim().length === 0)
      return Response.json({ error: 'Паведамленне не можа быць пустым' }, { status: 400 });

    if (message.length > 2000)
      return Response.json({ error: 'Паведамленне занадта доўгае (максімум 2000 знакаў)' }, { status: 400 });

    const existingPlace = await db.query.places.findFirst({ where: { id: placeId } });
    if (!existingPlace) return Response.json({ error: 'Населены пункт не знойдзены' }, { status: 404 });

    const [inserted] = await db
      .insert(feedback)
      .values({ placeId, message: message.trim() })
      .returning({ id: feedback.id });

    return Response.json({ id: inserted.id, success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Памылка адпраўкі водгуку';
    return Response.json({ error: message }, { status: 500 });
  }
};
