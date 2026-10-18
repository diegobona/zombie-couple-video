import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const videoTrial = pgTable('video_trial', {
  key: text('key').primaryKey(),
  state: text('state').notNull().default('available'),
  reservationId: text('reservation_id'),
  taskId: text('task_id'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [index('video_trial_reservation_idx').on(table.reservationId), index('video_trial_task_idx').on(table.taskId)]);

export const videoTrialRate = pgTable('video_trial_rate', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
