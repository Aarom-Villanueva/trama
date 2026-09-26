import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { getDatabase } from "../../db";
import type { Database } from "../../db/client";
import { categories, products, productColors, productImages, productVariants } from "../../db/schema/catalog";
import { availabilityOf, type CatalogProduct } from "./types";

// Not wired into any public route yet. Only published data crosses this boundary.
export async function listPublishedProducts(db: Database = getDatabase()): Promise<CatalogProduct[]> {
  return db.transaction(async (tx) => {
    const rows = await tx.select({ product: products, category: categories })
      .from(products).innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.status, "published")).orderBy(asc(products.position), asc(products.id));
    if (!rows.length) return [];
    const ids = rows.map(({ product }) => product.id);
    const colors = await tx.select().from(productColors).where(inArray(productColors.productId, ids)).orderBy(asc(productColors.position), asc(productColors.id));
    const variants = await tx.select().from(productVariants).where(inArray(productVariants.productId, ids)).orderBy(asc(productVariants.position), asc(productVariants.id));
    const images = await tx.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.position));
    return rows.map(({ product: p, category }) => ({
      id: p.id, slug: p.slug, name: p.name, description: p.description, fit: p.fit,
      collection: p.collection, category: { slug: category.slug, name: category.name },
      priceMinor: p.priceMinor, currency: "PEN", position: p.position, featuredPosition: p.featuredPosition,
      colors: colors.filter((c) => c.productId === p.id).map(({ id, code, name, hex }) => ({ id, code, name, hex })),
      variants: variants.filter((v) => v.productId === p.id && v.active).map(({ id, colorId, sizeCode, stock }) => ({ id, colorId, sizeCode, availability: availabilityOf(stock) })),
      images: images.filter((i) => i.productId === p.id).map(({ colorId, url, alt }) => ({ colorId, url, alt })),
    }));
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}
