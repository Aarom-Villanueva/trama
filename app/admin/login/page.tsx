import { readAuthConfiguration } from "@/lib/auth-config";
import { AdminLogin } from "@/features/admin/login";
export const metadata = { title: "Acceso administrativo", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  return <AdminLogin configured={Boolean(readAuthConfiguration())} denied={(await searchParams).denied === "1"} />;
}
