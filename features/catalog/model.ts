import type { CatalogProduct } from "../products/types";
export type StoreProduct = CatalogProduct & {
  gender: "mujer" | "hombre"; categoryName: string; color: string; hex: string; sizes: string[];
  photos: { front: string; back: string };
};
export function toStoreProduct(p: CatalogProduct): StoreProduct {
  return { ...p, gender: p.collection, categoryName: p.category.name, color: p.colors.map((c) => c.name).join(" / "), hex: p.colors[0]?.hex ?? "#888888", sizes: [...new Set(p.variants.map((v) => v.sizeCode))], photos: { front: p.images[0]?.url ?? "/favicon.svg", back: p.images[1]?.url ?? p.images[0]?.url ?? "/favicon.svg" } };
}
export const money = (minor: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 }).format(minor / 100);
