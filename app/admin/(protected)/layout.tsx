import Link from "next/link";
import { requireAdminPage } from "@/lib/require-admin";
import { SignOut } from "@/features/admin/login";
export const dynamic = "force-dynamic";
export const metadata = { title: "Administración", robots: { index: false, follow: false } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <main id="main" className="wrap admin-shell"><nav className="admin-nav"><Link href="/admin">TRAMA / ADMINISTRACIÓN</Link><div><Link href="/catalogo">Ver catálogo ↗</Link><SignOut /></div></nav>{children}</main>;
}
