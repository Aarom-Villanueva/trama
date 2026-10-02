import { getPublicCatalog } from "@/features/catalog/queries";
export const dynamic = "force-dynamic";
export async function GET() { return Response.json(await getPublicCatalog(), { headers: { "Cache-Control": "no-store" } }); }
