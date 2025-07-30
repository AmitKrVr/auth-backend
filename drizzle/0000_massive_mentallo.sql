CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"mobile_number" varchar(15) NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "users_mobile_number_unique" UNIQUE("mobile_number"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
