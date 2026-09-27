// Public application contract. No ORM imports or inferred database row types.
export type Availability = "to_confirm" | "out_of_stock" | "available";
export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  fit: string;
  collection: "mujer" | "hombre";
  category: { slug: string; name: string };
  priceMinor: number;
  currency: "PEN";
  position: number;
  featuredPosition: number | null;
  colors: { id: string; code: string; name: string; hex: string }[];
  variants: { id: string; colorId: string; sizeCode: string; availability: Availability; maxQuantity: number }[];
  images: { colorId: string | null; url: string; alt: string }[];
};

export function availabilityOf(stock: number | null): Availability {
  if (stock === null) return "to_confirm";
  if (!Number.isInteger(stock) || stock < 0) throw new Error("Invalid stock.");
  return stock === 0 ? "out_of_stock" : "available";
}
