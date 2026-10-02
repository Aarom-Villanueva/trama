import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/require-admin";
import { readCatalogProducts } from "@/features/products/repository";
import { getDatabase } from "@/db";
import { toStoreProduct } from "@/features/catalog/model";
import { ProductDetail } from "@/features/catalog/product-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(); const { id } = await params;
  const product = (await readCatalogProducts(getDatabase(), false)).find((p) => p.id === id);
  if (!product) notFound(); return <ProductDetail product={toStoreProduct(product)} preview />;
}
