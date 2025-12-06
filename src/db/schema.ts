import { sql } from 'drizzle-orm';
import { bigint, index, integer, pgEnum, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

import { geoPoint4326 } from './types';

export const genderEnum = pgEnum('gender', ['m', 'f', 'n', 'p']);

export const localityTypeEnum = pgEnum('locality_type', [
  'agrotown', // аграгарадок (аг.)
  'village', // вёска (в.)
  'city', // горад (г.)
  'urban_settlement', // гарадскі пасёлак (г.п., г. п.)
  'resort_settlement', // курортны пасёлак (к.п., к. п.)
  'townlet', // мястэчка (мяст.)
  'settlement', // пасёлак (п.)
  'worker_settlement', // рабочы пасёлак (р.п., р. п.)
  'siding', // раз'езд (раз’езд, рзд)
  'selo', // сяло (с.)
  'station', // станцыя (ст.)
  'farmstead', // хутар (х.)
]);

export const formsTypesEnum = pgEnum('forms_types', [
  'main',
  'alias',
  'alias-ru',
  'transliteration',
  'russian',
  'paradigm',
]);

export const places = pgTable(
  'places',
  {
    id: serial().primaryKey(),

    region: text().notNull(),
    district: text(),
    council: text(),
    type: localityTypeEnum().notNull(),

    name: text().notNull(),

    coordinates: geoPoint4326(),
    osmId: bigint({ mode: 'string' }),
  },
  (table) => [
    index('idx_settlements_name_trgm').using('gin', sql`${table.name} gin_trgm_ops`),
    index('idx_settlements_coords').using('gist', table.coordinates),
  ],
);

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

    // language: varchar({ length: 2 }).notNull(),

    form: text().notNull(),
  },
  (table) => [
    index('idx_forms_form_trgm').using('gin', sql`${table.form} gin_trgm_ops`),
    index('idx_forms_place_id').on(table.placeId),
  ],
);
