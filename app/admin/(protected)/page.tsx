import { requireAdminPage } from "@/lib/require-admin";
import { adminProducts } from "@/features/products/admin";
import { AdminList } from "@/features/admin/product-list";
export default async function Page() { await requireAdminPage(); return <AdminList products={await adminProducts().list()} />; }
