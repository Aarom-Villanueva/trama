import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

if (!existsSync(".env.local")) throw new Error("Ejecuta primero npm run db:setup.");
const current = readFileSync(".env.local", "utf8");
const values = { BETTER_AUTH_URL: "http://localhost:3000", BETTER_AUTH_SECRET: randomBytes(32).toString("hex") };
const missing = Object.entries(values).filter(([key]) => !new RegExp("^\\s*" + key + "=", "m").test(current));
if (missing.length) appendFileSync(".env.local", "\n" + missing.map(([key, value]) => key + "=" + value).join("\n") + "\n");
console.log("Configuración base de auth preparada en .env.local, sin sobrescribir valores ni imprimir secretos. Completa las tres variables de Google/administrador de docs/admin-local.md.");
