import { products } from "./products";
// Static asset library only. Product reads elsewhere must use PostgreSQL.
export const imageLibrary = products.flatMap((p) => [
  { url: p.images.front, label: p.name + " · " + p.color + " · Frente" },
  { url: p.images.back, label: p.name + " · " + p.color + " · Espalda" },
]);
