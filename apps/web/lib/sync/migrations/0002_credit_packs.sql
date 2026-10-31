CREATE TABLE "ai_credits" (
	"user_id" text PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "ai_credits_balance_not_negative" CHECK ("ai_credits"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "credit_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pack_id" text NOT NULL,
	"credits" integer NOT NULL,
	"price" integer NOT NULL,
	"amount" integer NOT NULL,
	"qr_string" text NOT NULL,
	"status" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "credit_payments_status" CHECK ("credit_payments"."status" in ('pending', 'paid', 'expired', 'cancelled', 'reversed')),
	CONSTRAINT "credit_payments_amount" CHECK ("credit_payments"."amount" > 0 and "credit_payments"."amount" <= "credit_payments"."price" and "credit_payments"."credits" > 0)
);
--> statement-breakpoint
ALTER TABLE "ai_credits" ADD CONSTRAINT "ai_credits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_payments" ADD CONSTRAINT "credit_payments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_payments_user_idx" ON "credit_payments" USING btree ("user_id","created_at");