CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" text PRIMARY KEY,
	"student_id" text NOT NULL,
	"date" text NOT NULL,
	"student_name" text DEFAULT '' NOT NULL,
	"class_name" text DEFAULT '' NOT NULL,
	"section" text DEFAULT '' NOT NULL,
	"roll" text DEFAULT '' NOT NULL,
	"status" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY,
	"student_id" text NOT NULL,
	"student_name" text DEFAULT '' NOT NULL,
	"class_name" text DEFAULT '' NOT NULL,
	"month" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"due_date" text NOT NULL,
	"status" text DEFAULT 'Due' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"endpoint" text PRIMARY KEY,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"role" text,
	"student_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_reports" (
	"id" text PRIMARY KEY,
	"student_id" text NOT NULL,
	"student_name" text DEFAULT '' NOT NULL,
	"class_name" text DEFAULT '' NOT NULL,
	"staff" text NOT NULL,
	"issue" text NOT NULL,
	"status" text DEFAULT 'Open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_reports" (
	"id" text PRIMARY KEY,
	"from_student_id" text NOT NULL,
	"from_student_name" text DEFAULT '' NOT NULL,
	"against_student_name" text NOT NULL,
	"against_class_name" text DEFAULT '' NOT NULL,
	"against_roll" text DEFAULT '' NOT NULL,
	"against_section" text DEFAULT '' NOT NULL,
	"issue" text NOT NULL,
	"status" text DEFAULT 'Open' NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_ratings" (
	"id" text PRIMARY KEY,
	"student_id" text NOT NULL,
	"student_name" text DEFAULT '' NOT NULL,
	"teacher" text NOT NULL,
	"week" text NOT NULL,
	"month" text NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_student_date_idx" ON "attendance" ("student_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_student_month_idx" ON "payments" ("student_id","month");--> statement-breakpoint
CREATE INDEX "staff_reports_student_idx" ON "staff_reports" ("student_id");--> statement-breakpoint
CREATE INDEX "student_reports_from_idx" ON "student_reports" ("from_student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teacher_ratings_student_week_idx" ON "teacher_ratings" ("student_id","week");