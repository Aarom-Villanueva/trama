import { migrate } from "drizzle-orm/node-postgres/migrator";
import { openLocalDatabase, runLocalCommand } from "./lib/local-db";

await runLocalCommand(async () => {
  const { db, pool } = await openLocalDatabase();
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Versioned migrations applied to the dedicated local TRAMA database.");
  } finally { await pool.end(); }
});
