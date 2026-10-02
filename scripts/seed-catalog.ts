import { access } from "node:fs/promises";
import { join } from "node:path";
import { buildCatalogFixture, fixtureCounts } from "./lib/catalog-fixture";
import { LocalConfigurationError, openLocalDatabase, runLocalCommand } from "./lib/local-db";
import { seedCatalog } from "./lib/seed";

await runLocalCommand(async () => {
  const args = process.argv.slice(2);
  if (args.some((arg) => !["--dry-run", "--source-only"].includes(arg))) {
    throw new LocalConfigurationError("Supported flags: --dry-run (read-only database diff), --source-only (no database).");
  }
  const fixture = buildCatalogFixture();
  for (const entry of fixture.entries) {
    for (const image of entry.images) await access(join("public", image.url));
  }
  if (args.includes("--source-only")) {
    console.log(JSON.stringify({ source: fixtureCounts(fixture), databaseAccessed: false }, null, 2));
    return;
  }
  const { db, pool } = await openLocalDatabase();
  try {
    console.log(JSON.stringify(await seedCatalog(db, { fixture, dryRun: args.includes("--dry-run") }), null, 2));
  } finally { await pool.end(); }
});
