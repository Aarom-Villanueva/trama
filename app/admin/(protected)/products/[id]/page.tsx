import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/require-admin";
import { adminProducts } from "@/features/products/admin";
import { ProductForm } from "@/features/admin/product-form";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage(); const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const service = adminProducts(); const product = await service.get(id); if (!product) notFound();
  return <ProductForm key={product.id + ":" + product.version} initial={product} categories={await service.categoryOptions()} />;
}
