import { defineRelations } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  places: {
    forms: r.many.forms(),
  },
  forms: {
    place: r.one.places({
      from: r.forms.placeId,
      to: r.places.id,
    }),
  },
  // Auth
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
  },
}));

const databaseUrl = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not defined');
const db = drizzle(databaseUrl, { schema, relations, casing: 'snake_case' });

export default db;
export * from './schema';
