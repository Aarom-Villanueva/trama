import "server-only";
import { inArray, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { categories, products, productColors, productVariants, productImages } from "../../db/schema/catalog";
import { buildCatalogFixture, fixtureCounts, type CatalogFixture } from "./catalog-fixture";

// Product + all its children are one import unit. Existing units are never repaired
// or updated: a later edit, archive, SKU change or removed image must survive reruns.
export async function seedCatalog(db: Database, options: { dryRun?: boolean; fixture?: CatalogFixture } = {}) {
  const fixture = options.fixture ?? buildCatalogFixture();
  return db.transaction(async (tx) => {
    if (!options.dryRun) await tx.execute(sql`select pg_advisory_xact_lock(74190321)`);
    const existingCategories = fixture.categories.length ? await tx.select().from(categories)
      .where(inArray(categories.importKey, fixture.categories.map((c) => c.importKey))) : [];
    const existingProducts = fixture.entries.length ? await tx.select({ importKey: products.importKey }).from(products)
      .where(inArray(products.importKey, fixture.entries.map((p) => p.product.importKey))) : [];
    const categoryIds = new Map(existingCategories.map((c) => [c.importKey, c.id]));
    const productKeys = new Set(existingProducts.map((p) => p.importKey));
    const pendingCategories = fixture.categories.filter((c) => !categoryIds.has(c.importKey));
    const pendingProducts = fixture.entries.filter((p) => !productKeys.has(p.product.importKey));
    const plan = {
      source: fixtureCounts(fixture),
      insert: fixtureCounts({ categories: pendingCategories, entries: pendingProducts }),
      skippedProducts: existingProducts.length,
      dryRun: Boolean(options.dryRun),
    };
    if (options.dryRun) return plan;
    for (const category of pendingCategories) {
      const [inserted] = await tx.insert(categories).values(category).returning({ id: categories.id });
      categoryIds.set(category.importKey, inserted.id);
    }
    for (const entry of pendingProducts) {
      const categoryId = categoryIds.get(entry.categoryKey);
      if (!categoryId) throw new Error("Missing fixture category.");
      // Conflicting slug/SKU owned by another import key fails and rolls back.
      const [product] = await tx.insert(products).values({ ...entry.product, categoryId }).returning({ id: products.id });
      const [color] = await tx.insert(productColors).values({ ...entry.color, productId: product.id }).returning({ id: productColors.id });
      await tx.insert(productVariants).values(entry.variants.map((v) => ({ ...v, productId: product.id, colorId: color.id })));
      await tx.insert(productImages).values(entry.images.map((i) => ({ ...i, productId: product.id, colorId: color.id })));
    }
    return plan;
  }, options.dryRun ? { isolationLevel: "repeatable read", accessMode: "read only" } : undefined);
}
