"use server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "../../db";
import { requireAdmin } from "../../lib/require-admin";
import { AccessError } from "../../lib/admin-policy";
import { ProductError, productService } from "./service";
import { z } from "zod";

function message(error: unknown): string {
  if (error instanceof ProductError || error instanceof AccessError) return error.message;
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : error;
  if (cause && typeof cause === "object" && "code" in cause && cause.code === "23505") return "El slug, SKU, color u orden de destacado ya está en uso.";
  return "No se pudo guardar. Revisa los datos y vuelve a intentarlo.";
}
export async function saveProduct(input: unknown) {
  try { const result = await productService(getDatabase(), requireAdmin).save(input); revalidatePath("/", "layout"); return { ok: true as const, ...result }; }
  catch (error) { return { ok: false as const, error: message(error) }; }
}
export async function changeProductStatus(input: unknown) {
  try {
    await requireAdmin();
    const value = z.object({ id: z.string().uuid(), version: z.number().int().positive(), status: z.enum(["draft", "published", "archived"]) }).parse(input);
    await productService(getDatabase(), requireAdmin).changeStatus(value.id, value.version, value.status);
    revalidatePath("/", "layout"); return { ok: true as const };
  } catch (error) { return { ok: false as const, error: message(error) }; }
}
