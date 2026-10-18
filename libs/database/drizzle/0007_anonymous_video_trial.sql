CREATE TABLE "video_trial" (
	"key" text PRIMARY KEY NOT NULL,
	"state" text DEFAULT 'available' NOT NULL,
	"reservation_id" text,
	"task_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_trial_rate" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "video_trial_reservation_idx" ON "video_trial" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "video_trial_task_idx" ON "video_trial" USING btree ("task_id");