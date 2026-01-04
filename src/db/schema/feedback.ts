import { integer, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

import { places } from './places';

export const feedbackStatusEnum = pgEnum('feedback_status', ['pending', 'resolved', 'dismissed']);

export const feedback = pgTable('feedback', {
  id: serial().primaryKey(),
  placeId: integer()
    .references(() => places.id, { onDelete: 'cascade' })
    .notNull(),
  message: text().notNull(),
  status: feedbackStatusEnum().default('pending').notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  resolvedAt: timestamp(),
});
