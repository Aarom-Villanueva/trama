import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { categories, products, productColors, productVariants, productImages } from "../../db/schema/catalog";
import { productInput, priceToMinor, type ProductInput } from "./validation";

export class ProductError extends Error {}
export function productService(db: Database, authorize: () => Promise<unknown>) {
  async function get(id: string): Promise<ProductInput | null> {
    await authorize();
    const [p] = await db.select().from(products).where(eq(products.id, id));
    if (!p) return null;
    const colors = await db.select().from(productColors).where(eq(productColors.productId, id)).orderBy(productColors.position);
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id)).orderBy(productVariants.position);
    const images = await db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(productImages.position);
    return { id, version: p.version, name: p.name, slug: p.slug, description: p.description, fit: p.fit, categoryId: p.categoryId, collection: p.collection,
      price: (p.priceMinor / 100).toFixed(2), status: p.status, position: p.position, featuredPosition: p.featuredPosition,
      colors: colors.map((c) => ({ id: c.id, code: c.code, name: c.name, hex: c.hex })),
      variants: variants.filter((v) => v.active).map((v) => ({ id: v.id, colorCode: colors.find((c) => c.id === v.colorId)!.code, sizeCode: v.sizeCode, sku: v.sku, stock: v.stock })),
      images: images.map((i) => ({ url: i.url, alt: i.alt, colorCode: colors.find((c) => c.id === i.colorId)?.code ?? null })),
    };
  }
  async function list() {
    await authorize();
    return db.select({ id: products.id, name: products.name, slug: products.slug, status: products.status, priceMinor: products.priceMinor, version: products.version }).from(products).orderBy(products.position, products.name);
  }
  async function categoryOptions() { await authorize(); return db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.position); }
  async function save(input: unknown) {
    await authorize();
    const parsed = productInput.safeParse(input);
    if (!parsed.success) throw new ProductError(parsed.error.issues.map((i) => i.message).join(" "));
    const value = parsed.data;
    return db.transaction(async (tx) => {
      const [category] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.id, value.categoryId));
      if (!category) throw new ProductError("La categoría no existe.");
      const [old] = value.id ? await tx.select().from(products).where(eq(products.id, value.id)).for("update") : [];
      if (value.id && (!old || old.version !== value.version)) throw new ProductError("La prenda cambió. Recarga antes de guardar.");
      if (old && value.slug !== old.slug) throw new ProductError("El slug de una prenda existente se conserva para mantener su URL.");
      const oldColors = old ? await tx.select().from(productColors).where(eq(productColors.productId, old.id)) : [];
      const oldVariants = old ? await tx.select().from(productVariants).where(eq(productVariants.productId, old.id)) : [];
      if (value.colors.some((c) => c.id && !oldColors.some((o) => o.id === c.id)) || value.variants.some((v) => v.id && !oldVariants.some((o) => o.id === v.id))) throw new ProductError("Una variante o color no pertenece a esta prenda.");
      if (value.status === "published" && value.variants.some((v) => v.stock === null && !(old?.importKey?.startsWith("trama-demo:v1:") && oldVariants.some((o) => o.id === v.id && o.importKey?.startsWith("trama-demo:v1:") && o.stock === null)))) throw new ProductError("Indica stock explícito para las variantes nuevas. NULL solo se conserva en variantes demo importadas.");
      const fields = { categoryId: value.categoryId, name: value.name, slug: value.slug, description: value.description, fit: value.fit, collection: value.collection, priceMinor: priceToMinor(value.price), currency: "PEN", status: value.status, position: value.position, featuredPosition: value.featuredPosition, updatedAt: new Date() };
      const [product] = old
        ? await tx.update(products).set({ ...fields, version: old.version + 1 }).where(and(eq(products.id, old.id), eq(products.version, old.version))).returning()
        : await tx.insert(products).values(fields).returning();
      const colorIds = new Map<string, string>();
      for (const [position, color] of value.colors.entries()) {
        const fields = { productId: product.id, code: color.code, name: color.name, hex: color.hex, position, updatedAt: new Date() };
        const [saved] = color.id ? await tx.update(productColors).set(fields).where(eq(productColors.id, color.id)).returning() : await tx.insert(productColors).values(fields).returning();
        colorIds.set(color.code, saved.id);
      }
      for (const previous of oldVariants) if (!value.variants.some((v) => v.id === previous.id)) await tx.delete(productVariants).where(eq(productVariants.id, previous.id));
      for (const [position, variant] of value.variants.entries()) {
        const fields = { productId: product.id, colorId: colorIds.get(variant.colorCode)!, sizeCode: variant.sizeCode, sku: variant.sku, stock: variant.stock, active: true, position, updatedAt: new Date() };
        if (variant.id) await tx.update(productVariants).set(fields).where(eq(productVariants.id, variant.id));
        else await tx.insert(productVariants).values(fields);
      }
      await tx.delete(productImages).where(eq(productImages.productId, product.id));
      for (const previous of oldColors) if (!value.colors.some((c) => c.id === previous.id)) await tx.delete(productColors).where(eq(productColors.id, previous.id));
      if (value.images.length) await tx.insert(productImages).values(value.images.map((image, position) => ({ productId: product.id, colorId: image.colorCode ? colorIds.get(image.colorCode)! : null, url: image.url, alt: image.alt, position })));
      return { id: product.id, version: product.version, slug: product.slug };
    });
  }
  async function changeStatus(id: string, version: number, status: "draft" | "published" | "archived") {
    await authorize();
    if (!["draft", "published", "archived"].includes(status)) throw new ProductError("Estado inválido.");
    if (status === "published") { const value = await get(id); if (!value) throw new ProductError("Prenda no encontrada."); return save({ ...value, version, status }); }
    const [updated] = await db.update(products).set({ status, version: sql`${products.version} + 1`, updatedAt: new Date() }).where(and(eq(products.id, id), eq(products.version, version))).returning({ id: products.id });
    if (!updated) throw new ProductError("La prenda cambió. Recarga antes de continuar.");
    return updated;
  }
  return { get, list, categoryOptions, save, changeStatus };
}
