import { sql } from "drizzle-orm";
import { boolean, check, foreignKey, index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const productStatus = pgEnum("product_status", ["draft", "published", "archived"]);
export const productCollection = pgEnum("product_collection", ["mujer", "hombre"]);

const identity = () => ({
  id: uuid("id").defaultRandom().primaryKey(),
  // Stable source identity; never changed when an administrator edits a slug/SKU.
  importKey: text("import_key").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("category", {
  ...identity(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  position: integer("position").notNull(),
}, (t) => [
  check("category_name_nonempty", sql`length(trim(${t.name})) > 0`),
  check("category_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  check("category_position_nonnegative", sql`${t.position} >= 0`),
]);

export const products = pgTable("product", {
  ...identity(),
  categoryId: uuid("category_id").notNull().references(() => categories.id),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  fit: text("fit").notNull(),
  collection: productCollection("collection").notNull(),
  priceMinor: integer("price_minor").notNull(),
  currency: text("currency").default("PEN").notNull(),
  status: productStatus("status").default("draft").notNull(),
  position: integer("position").notNull(),
  featuredPosition: integer("featured_position").unique(),
  version: integer("version").default(1).notNull(),
}, (t) => [
  check("product_name_nonempty", sql`length(trim(${t.name})) > 0`),
  check("product_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  check("product_price_nonnegative", sql`${t.priceMinor} >= 0`),
  check("product_currency_pen", sql`${t.currency} = 'PEN'`),
  check("product_position_nonnegative", sql`${t.position} >= 0`),
  check("product_featured_position_nonnegative", sql`${t.featuredPosition} IS NULL OR ${t.featuredPosition} >= 0`),
  check("product_version_positive", sql`${t.version} > 0`),
  index("product_category_idx").on(t.categoryId),
  index("product_status_position_idx").on(t.status, t.position),
]);

export const productColors = pgTable("product_color", {
  ...identity(),
  productId: uuid("product_id").notNull().references(() => products.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  hex: text("hex").notNull(),
  position: integer("position").notNull(),
}, (t) => [
  unique("color_product_code_unique").on(t.productId, t.code),
  unique("color_product_id_unique").on(t.productId, t.id),
  check("color_code_format", sql`${t.code} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  check("color_name_nonempty", sql`length(trim(${t.name})) > 0`),
  check("color_hex_format", sql`${t.hex} ~ '^#[0-9a-fA-F]{6}$'`),
  check("color_position_nonnegative", sql`${t.position} >= 0`),
]);

export const productVariants = pgTable("product_variant", {
  ...identity(),
  productId: uuid("product_id").notNull().references(() => products.id),
  colorId: uuid("color_id").notNull(),
  sizeCode: text("size_code").notNull(),
  sku: text("sku").notNull().unique(),
  // NULL = unknown / availability to confirm. Never unlimited inventory.
  stock: integer("stock"),
  active: boolean("active").default(true).notNull(),
  position: integer("position").notNull(),
}, (t) => [
  foreignKey({ name: "variant_color_same_product_fk", columns: [t.productId, t.colorId], foreignColumns: [productColors.productId, productColors.id] }),
  unique("variant_combination_unique").on(t.productId, t.colorId, t.sizeCode),
  check("variant_sku_format", sql`${t.sku} ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'`),
  check("variant_size_format", sql`${t.sizeCode} ~ '^[A-Z0-9]+$'`),
  check("variant_stock_nonnegative_or_unknown", sql`${t.stock} IS NULL OR ${t.stock} >= 0`),
  check("variant_position_nonnegative", sql`${t.position} >= 0`),
]);

export const productImages = pgTable("product_image", {
  ...identity(),
  productId: uuid("product_id").notNull().references(() => products.id),
  colorId: uuid("color_id"),
  url: text("url").notNull(),
  alt: text("alt").notNull(),
  position: integer("position").notNull(),
}, (t) => [
  foreignKey({ name: "image_color_same_product_fk", columns: [t.productId, t.colorId], foreignColumns: [productColors.productId, productColors.id] }),
  unique("image_product_position_unique").on(t.productId, t.position),
  check("image_url_nonempty", sql`length(trim(${t.url})) > 0`),
  check("image_alt_nonempty", sql`length(trim(${t.alt})) > 0`),
  check("image_position_nonnegative", sql`${t.position} >= 0`),
]);
