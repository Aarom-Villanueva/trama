import "server-only";
import { openDatabase } from "./client";

let connection: ReturnType<typeof openDatabase> | undefined;

// Lazy: public routes still build and run without DATABASE_URL.
export function getDatabase() {
  if (!connection) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for database access.");
    connection = openDatabase(process.env.DATABASE_URL);
  }
  return connection.db;
}
