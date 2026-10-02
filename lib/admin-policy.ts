import "server-only";
import { and, eq } from "drizzle-orm";
import type { Database } from "../db/client";
import { adminAccess, account, user } from "../db/schema/auth";

export class AccessError extends Error {
  constructor(public readonly status: 401 | 403) { super(status === 401 ? "Inicia sesión para continuar." : "No tienes acceso administrativo."); }
}
export function permittedIdentity(identity: { email: string; emailVerified: boolean }, configuredEmail: string) {
  return Boolean(configuredEmail.trim()) && identity.emailVerified && identity.email.toLowerCase().trim() === configuredEmail.toLowerCase().trim();
}
export async function checkAdminAccess(db: Database, userId: string, configuredEmail: string) {
  const [row] = await db.select({ email: user.email, emailVerified: user.emailVerified, active: adminAccess.active }).from(user)
    .innerJoin(adminAccess, eq(adminAccess.userId, user.id)).innerJoin(account, and(eq(account.userId, user.id), eq(account.providerId, "google")))
    .where(eq(user.id, userId)).limit(1);
  if (!row?.active || !permittedIdentity(row, configuredEmail)) throw new AccessError(403);
  return { userId };
}
export async function authorizeSession(db: Database, session: { user: { id: string } } | null, configuredEmail: string) {
  if (!session) throw new AccessError(401);
  return checkAdminAccess(db, session.user.id, configuredEmail);
}
