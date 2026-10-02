import { products } from "../../data/products";
import { featuredProductSlugs } from "../../data/catalog-presentation";

export function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function toMinorUnits(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Price must have at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const minor = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  if (minor > BigInt(2147483647)) throw new Error("Price exceeds the database integer range.");
  return Number(minor);
}

const prefix = "trama-demo:v1:";
export function buildCatalogFixture() {
  const categoryNames = [...new Set(products.map((p) => p.category))];
  const categories = categoryNames.map((name, position) => ({
    importKey: prefix + "category:" + slugify(name), name, slug: slugify(name), position,
  }));
  const entries = products.map((p, position) => {
    const importKey = prefix + "product:" + p.slug;
    const featuredPosition = featuredProductSlugs.findIndex((slug) => slug === p.slug);
    const color = { importKey: importKey + ":color:" + slugify(p.color), code: slugify(p.color), name: p.color, hex: p.hex, position: 0 };
    return {
      categoryKey: prefix + "category:" + slugify(p.category),
      product: {
        importKey, slug: p.slug, name: p.name, description: p.description, fit: p.fit,
        collection: p.gender, priceMinor: toMinorUnits(String(p.price)), currency: "PEN" as const,
        status: "published" as const, position, featuredPosition: featuredPosition < 0 ? null : featuredPosition,
      },
      color,
      variants: p.sizes.map((sizeCode, position) => ({
        importKey: importKey + ":variant:" + color.code + ":" + sizeCode,
        sizeCode, sku: ("TRAMA-" + p.slug + "-" + sizeCode).toUpperCase(),
        stock: null, active: true, position,
      })),
      images: (["front", "back"] as const).map((view, position) => ({
        importKey: importKey + ":image:" + view, url: p.images[view],
        alt: p.name + " " + p.color + ", vista de " + (view === "front" ? "frente" : "espalda"), position,
      })),
    };
  });
  return { categories, entries };
}

export type CatalogFixture = ReturnType<typeof buildCatalogFixture>;

export function fixtureCounts(fixture: CatalogFixture) {
  return {
    categories: fixture.categories.length,
    products: fixture.entries.length,
    colors: fixture.entries.length,
    variants: fixture.entries.reduce((n, p) => n + p.variants.length, 0),
    images: fixture.entries.reduce((n, p) => n + p.images.length, 0),
    featured: fixture.entries.filter((p) => p.product.featuredPosition !== null).length,
  };
}
