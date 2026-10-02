import type { StoreProduct } from "../catalog/model";
export type BagItem = { variantId: string; quantity: number };
export function reconcileSelection(input: unknown, products: StoreProduct[]): BagItem[] {
  if (!Array.isArray(input)) return [];
  const result = new Map<string, BagItem>();
  for (const raw of input) {
    if (!raw || typeof raw !== "object" || !Number.isInteger(raw.quantity) || raw.quantity < 1) continue;
    // The v1 catalog had one color per slug; never guess when a legacy line is ambiguous.
    const candidates = products.flatMap((p) => p.variants.filter((v) => typeof raw.variantId === "string" ? v.id === raw.variantId : p.slug === raw.slug && v.sizeCode === raw.size));
    if (candidates.length !== 1 || candidates[0].availability === "out_of_stock") continue;
    const variant = candidates[0];
    result.set(variant.id, { variantId: variant.id, quantity: Math.min(variant.maxQuantity, 99, (result.get(variant.id)?.quantity ?? 0) + raw.quantity) });
  }
  return [...result.values()];
}
