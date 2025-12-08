import { sql } from 'drizzle-orm';
import { bigint, index, pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core';

import { geoPoint4326 } from '../types';

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
