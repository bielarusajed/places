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

const db = drizzle(process.env.DATABASE_URL!, { schema, casing: 'snake_case' });

export default db;
export * from './schema';
