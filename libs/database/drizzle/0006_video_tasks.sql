CREATE TABLE "video_task" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"provider_task_id" text NOT NULL,
	"credit_cost" integer NOT NULL,
	"consume_transaction_id" text,
	"status" text DEFAULT 'processing' NOT NULL,
	"result" jsonb,
	"error_message" text,
	"refunded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_task" ADD CONSTRAINT "video_task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_task" ADD CONSTRAINT "video_task_consume_transaction_id_credit_transaction_id_fk" FOREIGN KEY ("consume_transaction_id") REFERENCES "public"."credit_transaction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_task_user_created_idx" ON "video_task" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "video_task_provider_id_idx" ON "video_task" USING btree ("provider","provider_task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "video_task_consumption_idx" ON "video_task" USING btree ("consume_transaction_id");