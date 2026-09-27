import { defineConfig } from "drizzle-kit";

// Generation needs no credentials. Apply SQL through the guarded local script.
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/*.ts",
  out: "./drizzle",
  strict: true,
});
