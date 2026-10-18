import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const videoTrial = sqliteTable('video_trial', {
  key: text('key').primaryKey(),
  state: text('state').notNull().default('available'),
  reservationId: text('reservation_id'),
  taskId: text('task_id'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, table => [index('video_trial_reservation_idx').on(table.reservationId), index('video_trial_task_idx').on(table.taskId)]);

export const videoTrialRate = sqliteTable('video_trial_rate', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});
