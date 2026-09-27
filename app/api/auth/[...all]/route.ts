import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";
const routes = new Set(["/sign-in/social", "/callback/google", "/get-session", "/sign-out", "/error"]);
async function handle(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth/, "");
  if (!routes.has(path)) return Response.json({ error: "Operación no disponible." }, { status: 403 });
  const auth = getAuth();
  if (!auth) return Response.json({ error: "Acceso administrativo sin configurar." }, { status: 503 });
  return auth.handler(request);
}
export const GET = handle;
export const POST = handle;
