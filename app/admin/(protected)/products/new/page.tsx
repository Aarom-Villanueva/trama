import { requireAdminPage } from "@/lib/require-admin";
import { adminProducts } from "@/features/products/admin";
import { ProductForm } from "@/features/admin/product-form";
export default async function Page() { await requireAdminPage(); return <ProductForm categories={await adminProducts().categoryOptions()} />; }
