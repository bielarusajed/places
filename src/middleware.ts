import { defineMiddleware } from 'astro:middleware';

import { auth } from '@/lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const isAuthed = await auth.api.getSession({
    headers: context.request.headers,
  });

  if (isAuthed) {
    context.locals.user = isAuthed.user;
    context.locals.session = isAuthed.session;
  } else {
    context.locals.user = null;
    context.locals.session = null;
  }

  const pathname = decodeURI(context.url.pathname);

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!isAuthed) {
      if (pathname.startsWith('/api/admin'))
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      return context.redirect('/login');
    }
  }

  return next();
});
