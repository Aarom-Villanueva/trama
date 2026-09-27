import "server-only";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getDatabase } from "../db";
import type { Database } from "../db/client";
import * as schema from "../db/schema/auth";
import { checkAdminAccess, permittedIdentity } from "./admin-policy";
import { readAuthConfiguration, type AuthConfiguration } from "./auth-config";

export function createAuth(db: Database, config: AuthConfiguration) {
  return betterAuth({
    appName: "TRAMA", baseURL: config.baseURL, secret: config.secret,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    trustedOrigins: [new URL(config.baseURL).origin],
    emailAndPassword: { enabled: false },
    socialProviders: { google: { clientId: config.clientId, clientSecret: config.clientSecret, prompt: "select_account", disableIdTokenSignIn: true } },
    account: { accountLinking: { enabled: false } },
    session: { expiresIn: 60 * 60 * 8, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 30 },
    databaseHooks: {
      user: { create: {
        before: async (identity) => {
          if (!permittedIdentity(identity, config.adminEmail)) throw new APIError("FORBIDDEN", { message: "Acceso no autorizado." });
          return { data: identity };
        },
        after: async (identity) => {
          if (permittedIdentity(identity, config.adminEmail)) await db.insert(schema.adminAccess).values({ userId: identity.id, active: true }).onConflictDoNothing();
        },
      } },
      session: { create: { before: async (value) => {
        try { await checkAdminAccess(db, value.userId, config.adminEmail); } catch { throw new APIError("FORBIDDEN", { message: "Acceso no autorizado." }); }
        return { data: value };
      } } },
    },
  });
}
let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  const config = readAuthConfiguration();
  if (!config) return null;
  return auth ??= createAuth(getDatabase(), config);
}
