import { sql } from 'drizzle-orm';
import { index, integer, pgEnum, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

import { places } from './places';

export const genderEnum = pgEnum('gender', ['m', 'f', 'n', 'p']);

export const formsTypesEnum = pgEnum('forms_types', [
  'main',
  'alias',
  'alias-ru',
  'transliteration',
  'russian',
  'paradigm',
]);

export const forms = pgTable(
  'forms',
  {
    id: serial().primaryKey(),

    placeId: integer().references(() => places.id),

    type: formsTypesEnum().notNull(),
    paradigmVariant: text(),
    paradigmTag: varchar({ length: 3 }),
    gender: genderEnum(),
    stressIndexes: integer().array().default([]),

    form: text().notNull(),
  },
  (table) => [
    index('idx_forms_form_trgm').using('gin', sql`${table.form} gin_trgm_ops`),
    index('idx_forms_place_id').on(table.placeId),
    index('idx_forms_place_type').on(table.placeId, table.type),
  ],
);
