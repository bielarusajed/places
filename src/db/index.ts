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
}));

const databaseUrl = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not defined');
const db = drizzle(databaseUrl, { schema, casing: 'snake_case' });

export default db;
export * from './schema';
