import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/catalog";

export function openDatabase(connectionString: string) {
  const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

export type Database = ReturnType<typeof openDatabase>["db"];
