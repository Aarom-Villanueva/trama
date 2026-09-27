import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase } from "../db";
import { getAuth } from "./auth";
import { readAuthConfiguration } from "./auth-config";
import { AccessError, authorizeSession } from "./admin-policy";

export async function requireAdmin() {
  const auth = getAuth();
  const config = readAuthConfiguration();
  if (!auth || !config) throw new AccessError(401);
  const session = await auth.api.getSession({ headers: await headers() });
  return authorizeSession(getDatabase(), session, config.adminEmail);
}
export async function requireAdminPage() {
  try { return await requireAdmin(); } catch (error) {
    if (error instanceof AccessError) redirect("/admin/login?denied=" + (error.status === 403 ? "1" : "0"));
    throw error;
  }
}
