CREATE TABLE `video_task` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`provider_task_id` text NOT NULL,
	`credit_cost` integer NOT NULL,
	`consume_transaction_id` text,
	`status` text DEFAULT 'processing' NOT NULL,
	`result` text,
	`error_message` text,
	`refunded` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`consume_transaction_id`) REFERENCES `credit_transaction`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `video_task_user_created_idx` ON `video_task` (`user_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `video_task_provider_id_idx` ON `video_task` (`provider`,`provider_task_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `video_task_consumption_idx` ON `video_task` (`consume_transaction_id`);