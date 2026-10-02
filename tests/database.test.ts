import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { openDatabase, type Database } from "../db/client";
import { categories, products, productColors, productImages, productVariants } from "../db/schema/catalog";
import { listPublishedProducts } from "../features/products/repository";
import { buildCatalogFixture, fixtureCounts } from "../scripts/lib/catalog-fixture";
import { localDatabaseUrl, openLocalDatabase } from "../scripts/lib/local-db";
import { seedCatalog } from "../scripts/lib/seed";
import { adminScenarios } from "./admin-scenarios";

function postgresCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  return "cause" in error ? postgresCode(error.cause) : undefined;
}

async function snapshot(db: Database) {
  return {
    categories: await db.select().from(categories).orderBy(categories.id),
    products: await db.select().from(products).orderBy(products.id),
    colors: await db.select().from(productColors).orderBy(productColors.id),
    variants: await db.select().from(productVariants).orderBy(productVariants.id),
    images: await db.select().from(productImages).orderBy(productImages.id),
  };
}

test("PostgreSQL foundation on an isolated disposable database", { timeout: 60000 }, async (t) => {
  // Do not reset trama_local or a user's data. Create and drop only our unique DB.
  const owner = await openLocalDatabase();
  const testName = "trama_test_" + randomUUID().replaceAll("-", "");
  assert.match(testName, /^trama_test_[a-f0-9]{32}$/);
  let created = false;
  let connection: ReturnType<typeof openDatabase> | undefined;
  try {
    await owner.pool.query('CREATE DATABASE "' + testName + '"');
    created = true;
    const url = new URL(localDatabaseUrl());
    url.pathname = "/" + testName;
    connection = openDatabase(url.toString());
    const { db, pool } = connection;
    const fixture = buildCatalogFixture();
    const expected = fixtureCounts(fixture);

    await t.test("versioned migration applies to an empty database and can be rerun", async () => {
      const before = await pool.query("select tablename from pg_tables where schemaname = 'public'");
      assert.equal(before.rows.length, 0);
      await migrate(db, { migrationsFolder: "./drizzle" });
      await migrate(db, { migrationsFolder: "./drizzle" });
      const after = await pool.query("select tablename from pg_tables where schemaname = 'public'");
      assert.deepEqual(after.rows.map((r) => r.tablename).sort(), ["admin_access", "auth_account", "auth_rate_limit", "auth_session", "auth_user", "auth_verification", "category", "product", "product_color", "product_image", "product_variant"]);
    });

    await t.test("dry run plans the import without writing", async () => {
      const before = await snapshot(db);
      const plan = await seedCatalog(db, { dryRun: true });
      assert.deepEqual(plan.insert, expected);
      assert.deepEqual(await snapshot(db), before);
    });

    await t.test("two seed executions preserve all rows and source data", async () => {
      const first = await seedCatalog(db);
      assert.deepEqual(first.insert, expected);
      const before = await snapshot(db);
      const second = await seedCatalog(db);
      assert.equal(second.insert.products, 0);
      assert.equal(second.insert.variants, 0);
      assert.deepEqual(await snapshot(db), before);
      assert.equal(before.categories.length, expected.categories);
      assert.equal(before.colors.length, expected.colors);
      assert.equal(before.variants.length, expected.variants);
      assert.equal(before.images.length, expected.images);
      assert.equal(before.products.length, expected.products);
      for (const entry of fixture.entries) {
        const p = before.products.find((row) => row.importKey === entry.product.importKey)!;
        for (const [key, value] of Object.entries(entry.product)) {
          assert.deepEqual(p[key as keyof typeof p], value);
        }
        const variants = before.variants.filter((v) => v.productId === p.id).sort((a, b) => a.position - b.position);
        assert.deepEqual(variants.map((v) => v.sizeCode), entry.variants.map((v) => v.sizeCode));
        assert.ok(variants.every((v) => v.stock === null));
        assert.deepEqual(before.images.filter((i) => i.productId === p.id).sort((a, b) => a.position - b.position).map((i) => i.url), entry.images.map((i) => i.url));
      }
    });

    await t.test("constraints reject duplicate SKU, combination, slug, image order, negative stock and cross-product colors", async () => {
      const state = await snapshot(db);
      const v = state.variants[0];
      const otherColor = state.colors.find((c) => c.productId !== v.productId)!;
      const image = state.images.find((i) => i.productId === v.productId)!;
      const rejects = async (operation: PromiseLike<unknown>, code: string) => {
        await assert.rejects(async () => { await operation; }, (error: unknown) => postgresCode(error) === code);
      };
      await rejects(db.insert(productVariants).values({ productId: v.productId, colorId: v.colorId, sizeCode: "XXL", sku: v.sku, stock: null, position: 9 }), "23505");
      await rejects(db.insert(productVariants).values({ productId: v.productId, colorId: v.colorId, sizeCode: v.sizeCode, sku: "TRAMA-TEST-NEW", stock: null, position: 9 }), "23505");
      await rejects(db.update(productVariants).set({ stock: -1 }).where(eq(productVariants.id, v.id)), "23514");
      await rejects(db.update(productVariants).set({ colorId: otherColor.id }).where(eq(productVariants.id, v.id)), "23503");
      await rejects(db.update(productImages).set({ colorId: otherColor.id }).where(eq(productImages.id, image.id)), "23503");
      await rejects(db.update(products).set({ slug: state.products[0].slug }).where(eq(products.id, state.products[1].id)), "23505");
      await rejects(db.update(products).set({ priceMinor: -1 }).where(eq(products.id, v.productId)), "23514");
      await rejects(db.insert(productImages).values({ productId: image.productId, colorId: image.colorId, url: image.url, alt: image.alt, position: image.position }), "23505");
      assert.deepEqual(await snapshot(db), state);
    });

    await t.test("public repository filters states and expresses unknown inventory explicitly", async () => {
      const entries = await listPublishedProducts(db);
      assert.deepEqual(entries.map((p) => p.slug), fixture.entries.map((e) => e.product.slug));
      assert.ok(entries.every((p) => p.variants.every((v) => v.availability === "to_confirm")));
      const first = entries[0];
      await db.update(products).set({ status: "draft" }).where(eq(products.id, first.id));
      assert.equal((await listPublishedProducts(db)).some((p) => p.id === first.id), false);
      await db.update(products).set({ status: "published" }).where(eq(products.id, first.id));
    });

    await t.test("seed never overwrites later edits or recreates removed children", async () => {
      const state = await snapshot(db);
      const p = state.products[0];
      const color = state.colors.find((c) => c.productId === p.id)!;
      const variant = state.variants.find((v) => v.productId === p.id)!;
      const images = state.images.filter((i) => i.productId === p.id);
      await db.update(categories).set({ name: "Edited category", slug: "edited-category" }).where(eq(categories.id, p.categoryId));
      await db.update(products).set({ name: "Edited product", slug: "edited-product", priceMinor: 12345, status: "archived", position: 99, featuredPosition: null, version: 2 }).where(eq(products.id, p.id));
      await db.update(productColors).set({ name: "Edited color", code: "edited-color", hex: "#123456" }).where(eq(productColors.id, color.id));
      // Synthetic quantity is confined to this disposable test DB, never the demo seed.
      await db.update(productVariants).set({ stock: 3, sku: "TRAMA-EDITED", active: false }).where(eq(productVariants.id, variant.id));
      await db.update(productImages).set({ alt: "Edited photo" }).where(eq(productImages.id, images[0].id));
      await db.delete(productImages).where(eq(productImages.id, images[1].id));
      const edited = await snapshot(db);
      await seedCatalog(db, { dryRun: true });
      await seedCatalog(db);
      assert.deepEqual(await snapshot(db), edited);
      assert.equal((await listPublishedProducts(db)).some((row) => row.id === p.id), false);
    });

    await t.test("a conflicting new import rolls back the complete transaction", async () => {
      const before = await snapshot(db);
      const conflicting = structuredClone(fixture);
      const unedited = before.products.find((p) => p.status === "published")!;
      conflicting.entries = [conflicting.entries.find((p) => p.product.importKey === unedited.importKey)!];
      conflicting.categories.push({ name: "Rollback category", slug: "rollback-category", importKey: "test:rollback", position: 99 });
      conflicting.entries[0].product.importKey = "test:conflicting-product";
      conflicting.entries[0].product.featuredPosition = null;
      // Existing slug, different import identity: do not silently adopt or overwrite it.
      await assert.rejects(() => seedCatalog(db, { fixture: conflicting }), (error: unknown) => postgresCode(error) === "23505");
      assert.deepEqual(await snapshot(db), before);
    });
    await adminScenarios(t, db);
  } finally {
    if (connection) await connection.pool.end();
    if (created) {
      assert.match(testName, /^trama_test_[a-f0-9]{32}$/);
      await owner.pool.query('DROP DATABASE "' + testName + '" WITH (FORCE)');
    }
    await owner.pool.end();
  }
});
