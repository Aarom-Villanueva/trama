import "server-only";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { openDatabase } from "../../db/client";

export class LocalConfigurationError extends Error {}

export function validateLocalUrl(value: string | undefined): string {
  let url: URL;
  try { url = new URL(value ?? ""); } catch {
    throw new LocalConfigurationError("Run npm run db:setup and configure the local TRAMA database.");
  }
  if (process.env.NODE_ENV === "production" || !["postgresql:", "postgres:"].includes(url.protocol)
    || url.hostname !== "127.0.0.1" || url.pathname !== "/trama_local"
    || url.username !== "trama_local" || !url.password || url.search || url.hash
    || !/^\d+$/.test(url.port) || Number(url.port) < 55432 || Number(url.port) > 55532) {
    throw new LocalConfigurationError("Refusing database access: only the dedicated local TRAMA database on ports 55432-55532 is allowed.");
  }
  return url.toString();
}

export function localDatabaseUrl() {
  if (existsSync(".env.local")) loadEnvFile(".env.local");
  return validateLocalUrl(process.env.DATABASE_URL);
}

export async function openLocalDatabase() {
  const connection = openDatabase(localDatabaseUrl());
  try {
    const result = await connection.pool.query<{ database: string; username: string }>("select current_database() as database, current_user as username");
    if (result.rows[0]?.database !== "trama_local" || result.rows[0]?.username !== "trama_local") {
      throw new LocalConfigurationError("Unexpected database identity; refusing to continue.");
    }
    return connection;
  } catch (error) {
    await connection.pool.end();
    throw error;
  }
}

export async function runLocalCommand(action: () => Promise<void>) {
  try { await action(); } catch (error) {
    // Driver errors may contain credentials or SQL values. Never print raw errors.
    console.error(error instanceof LocalConfigurationError ? error.message : "Local database command failed. Check Docker health, migrations and local configuration. No connection details are printed.");
    process.exitCode = 1;
  }
}
