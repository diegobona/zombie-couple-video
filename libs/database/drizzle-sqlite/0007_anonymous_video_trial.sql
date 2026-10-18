CREATE TABLE `video_trial` (
	`key` text PRIMARY KEY NOT NULL,
	`state` text DEFAULT 'available' NOT NULL,
	`reservation_id` text,
	`task_id` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `video_trial_reservation_idx` ON `video_trial` (`reservation_id`);--> statement-breakpoint
CREATE INDEX `video_trial_task_idx` ON `video_trial` (`task_id`);--> statement-breakpoint
CREATE TABLE `video_trial_rate` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `user` ADD `is_anonymous` integer DEFAULT false NOT NULL;