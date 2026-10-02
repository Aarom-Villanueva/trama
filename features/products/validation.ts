import { z } from "zod";
import { imageLibrary } from "../../data/image-library";

const slug = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones.");
const id = z.string().uuid().optional();
export const productInput = z.object({
  id, version: z.number().int().positive().optional(),
  slug, name: z.string().trim().min(1, "Escribe el nombre.").max(160), description: z.string().trim().max(5000), fit: z.string().trim().min(1).max(80),
  categoryId: z.string().uuid("Selecciona una categoría."), collection: z.enum(["mujer", "hombre"]),
  price: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, "Precio PEN con hasta dos decimales.").refine((v) => Number(v) <= 21474836.47, "Precio fuera de rango."),
  status: z.enum(["draft", "published", "archived"]), position: z.number().int().nonnegative().max(100000), featuredPosition: z.number().int().nonnegative().max(1000).nullable(),
  colors: z.array(z.object({ id, code: slug, name: z.string().trim().min(1).max(80), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) }).strict()).min(1).max(20),
  variants: z.array(z.object({ id, colorCode: slug, sizeCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,12}$/), sku: z.string().trim().toUpperCase().max(180).regex(/^[A-Z0-9]+(-[A-Z0-9]+)*$/), stock: z.number().int().min(0).max(2147483647).nullable() }).strict()).min(1).max(200),
  images: z.array(z.object({ url: z.string().refine((url) => imageLibrary.some((i) => i.url === url), "Elige una foto de la biblioteca TRAMA."), colorCode: slug.nullable(), alt: z.string().trim().min(1).max(200) }).strict()).max(24),
}).strict().superRefine((p, ctx) => {
  const add = (message: string) => ctx.addIssue({ code: "custom", message });
  if (p.id && !p.version) add("Falta la versión del producto.");
  if (new Set(p.colors.map((c) => c.code)).size !== p.colors.length) add("Hay colores repetidos.");
  if (new Set(p.variants.map((v) => v.sku)).size !== p.variants.length) add("Hay SKU repetidos.");
  if (new Set(p.variants.map((v) => v.colorCode + ":" + v.sizeCode)).size !== p.variants.length) add("Hay combinaciones talla/color repetidas.");
  if (p.variants.some((v) => !p.colors.some((c) => c.code === v.colorCode)) || p.images.some((i) => i.colorCode && !p.colors.some((c) => c.code === i.colorCode))) add("El color no pertenece a esta prenda.");
  if (new Set(p.images.map((i) => i.url)).size !== p.images.length) add("Hay fotos repetidas.");
  for (const list of [p.colors, p.variants]) { const ids = list.flatMap((x) => x.id ? [x.id] : []); if (new Set(ids).size !== ids.length) add("Hay identificadores repetidos."); }
  if (p.status === "published" && (!p.images.length || !p.description || Number(p.price) <= 0)) add("Para publicar se necesita descripción, precio mayor que cero y una foto.");
  if (p.status === "published" && !p.id && p.variants.some((v) => v.stock === null)) add("Una prenda nueva necesita stock explícito para publicarse.");
});
export type ProductInput = z.infer<typeof productInput>;
export function priceToMinor(value: string) { const [whole, cents = ""] = value.split("."); return Number(BigInt(whole) * BigInt(100) + BigInt(cents.padEnd(2, "0"))); }
