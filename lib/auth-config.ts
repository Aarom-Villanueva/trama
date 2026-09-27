import "server-only";
import { z } from "zod";

const configuration = z.object({
  baseURL: z.string().url(), secret: z.string().min(32), adminEmail: z.string().trim().email().transform((v) => v.toLowerCase()),
  clientId: z.string().min(1), clientSecret: z.string().min(1),
});
export type AuthConfiguration = z.infer<typeof configuration>;
export function readAuthConfiguration(): AuthConfiguration | null {
  const parsed = configuration.safeParse({ baseURL: process.env.BETTER_AUTH_URL, secret: process.env.BETTER_AUTH_SECRET, adminEmail: process.env.TRAMA_ADMIN_EMAIL, clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET });
  if (!parsed.success) return null;
  const url = new URL(parsed.data.baseURL);
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) return null;
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return null;
  if ([parsed.data.clientId, parsed.data.clientSecret, parsed.data.secret].some((v) => /replace|example|ficticio/i.test(v))) return null;
  return parsed.data;
}
