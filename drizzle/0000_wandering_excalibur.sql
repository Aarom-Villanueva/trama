CREATE TYPE "public"."product_collection" AS ENUM('mujer', 'hombre');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "category_import_key_unique" UNIQUE("import_key"),
	CONSTRAINT "category_slug_unique" UNIQUE("slug"),
	CONSTRAINT "category_name_nonempty" CHECK (length(trim("category"."name")) > 0),
	CONSTRAINT "category_slug_format" CHECK ("category"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "category_position_nonnegative" CHECK ("category"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_color" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"product_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"hex" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "product_color_import_key_unique" UNIQUE("import_key"),
	CONSTRAINT "color_product_code_unique" UNIQUE("product_id","code"),
	CONSTRAINT "color_product_id_unique" UNIQUE("product_id","id"),
	CONSTRAINT "color_code_format" CHECK ("product_color"."code" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "color_name_nonempty" CHECK (length(trim("product_color"."name")) > 0),
	CONSTRAINT "color_hex_format" CHECK ("product_color"."hex" ~ '^#[0-9a-fA-F]{6}$'),
	CONSTRAINT "color_position_nonnegative" CHECK ("product_color"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"product_id" uuid NOT NULL,
	"color_id" uuid,
	"url" text NOT NULL,
	"alt" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "product_image_import_key_unique" UNIQUE("import_key"),
	CONSTRAINT "image_product_position_unique" UNIQUE("product_id","position"),
	CONSTRAINT "image_url_nonempty" CHECK (length(trim("product_image"."url")) > 0),
	CONSTRAINT "image_alt_nonempty" CHECK (length(trim("product_image"."alt")) > 0),
	CONSTRAINT "image_position_nonnegative" CHECK ("product_image"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"product_id" uuid NOT NULL,
	"color_id" uuid NOT NULL,
	"size_code" text NOT NULL,
	"sku" text NOT NULL,
	"stock" integer,
	"active" boolean DEFAULT true NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "product_variant_import_key_unique" UNIQUE("import_key"),
	CONSTRAINT "product_variant_sku_unique" UNIQUE("sku"),
	CONSTRAINT "variant_combination_unique" UNIQUE("product_id","color_id","size_code"),
	CONSTRAINT "variant_sku_format" CHECK ("product_variant"."sku" ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'),
	CONSTRAINT "variant_size_format" CHECK ("product_variant"."size_code" ~ '^[A-Z0-9]+$'),
	CONSTRAINT "variant_stock_nonnegative_or_unknown" CHECK ("product_variant"."stock" IS NULL OR "product_variant"."stock" >= 0),
	CONSTRAINT "variant_position_nonnegative" CHECK ("product_variant"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"category_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"fit" text NOT NULL,
	"collection" "product_collection" NOT NULL,
	"price_minor" integer NOT NULL,
	"currency" text DEFAULT 'PEN' NOT NULL,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"position" integer NOT NULL,
	"featured_position" integer,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "product_import_key_unique" UNIQUE("import_key"),
	CONSTRAINT "product_slug_unique" UNIQUE("slug"),
	CONSTRAINT "product_featured_position_unique" UNIQUE("featured_position"),
	CONSTRAINT "product_name_nonempty" CHECK (length(trim("product"."name")) > 0),
	CONSTRAINT "product_slug_format" CHECK ("product"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "product_price_nonnegative" CHECK ("product"."price_minor" >= 0),
	CONSTRAINT "product_currency_pen" CHECK ("product"."currency" = 'PEN'),
	CONSTRAINT "product_position_nonnegative" CHECK ("product"."position" >= 0),
	CONSTRAINT "product_featured_position_nonnegative" CHECK ("product"."featured_position" IS NULL OR "product"."featured_position" >= 0),
	CONSTRAINT "product_version_positive" CHECK ("product"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "product_color" ADD CONSTRAINT "product_color_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image" ADD CONSTRAINT "image_color_same_product_fk" FOREIGN KEY ("product_id","color_id") REFERENCES "public"."product_color"("product_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "variant_color_same_product_fk" FOREIGN KEY ("product_id","color_id") REFERENCES "public"."product_color"("product_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_category_idx" ON "product" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_status_position_idx" ON "product" USING btree ("status","position");