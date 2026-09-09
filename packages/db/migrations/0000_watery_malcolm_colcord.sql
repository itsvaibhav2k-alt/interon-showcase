DO $$ BEGIN
 CREATE TYPE "public"."audit_actor_role" AS ENUM('student', 'counselor', 'reviewer', 'director', 'system');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."award_kind" AS ENUM('pell', 'tops', 'go_grant');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."award_status" AS ENUM('estimated', 'awarded', 'disbursed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."case_status" AS ENUM('pending_student', 'in_review', 'awaiting_correction', 'approved', 'escalated', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."enrollment_status" AS ENUM('enrolled', 'admitted', 'inactive');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."identity_method" AS ENUM('in_person', 'video_call', 'third_party', 'incarcerated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."preferred_language" AS ENUM('en', 'es', 'vi');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."staff_role" AS ENUM('counselor', 'reviewer', 'director');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."task_status" AS ENUM('not_started', 'in_progress', 'submitted', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."task_type" AS ENUM('verify_family_size', 'verify_identity', 'upload_tax_return', 'upload_w2', 'verify_untaxed_income', 'verify_high_school_completion', 'identity_video_call', 'identity_third_party');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."verification_group" AS ENUM('V1', 'V4', 'V5');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"banner_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"preferred_name" text,
	"ssn_encrypted" text NOT NULL,
	"ssn_last4" varchar(4) NOT NULL,
	"dob" date NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"enrollment_status" "enrollment_status" NOT NULL,
	"program" text NOT NULL,
	"preferred_language" "preferred_language" DEFAULT 'en' NOT NULL,
	"fa_ddx_populated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_banner_id_unique" UNIQUE("banner_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"initials" varchar(4) NOT NULL,
	"role" "staff_role" NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"kind" "award_kind" NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "award_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_awards_student_kind_unique" UNIQUE("student_id","kind")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_number" text NOT NULL,
	"student_id" uuid NOT NULL,
	"group" "verification_group" NOT NULL,
	"status" "case_status" DEFAULT 'pending_student' NOT NULL,
	"assigned_to" uuid,
	"tax_year" integer NOT NULL,
	"award_year" text NOT NULL,
	"identity_method" "identity_method",
	"deadline" date NOT NULL,
	"last_action_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_cases_case_number_unique" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"type" "task_type" NOT NULL,
	"status" "task_status" DEFAULT 'not_started' NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"actor_student_id" uuid,
	"actor_staff_id" uuid,
	"actor_role" "audit_actor_role" NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_awards" ADD CONSTRAINT "student_awards_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_cases" ADD CONSTRAINT "verification_cases_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_cases" ADD CONSTRAINT "verification_cases_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_tasks" ADD CONSTRAINT "verification_tasks_case_id_verification_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."verification_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_case_id_verification_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."verification_cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_student_id_students_id_fk" FOREIGN KEY ("actor_student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_staff_id_staff_id_fk" FOREIGN KEY ("actor_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_cases_student_award_year_idx" ON "verification_cases" USING btree ("student_id","award_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_tasks_case_status_idx" ON "verification_tasks" USING btree ("case_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_events_case_created_at_idx" ON "audit_events" USING btree ("case_id","created_at" DESC NULLS LAST);