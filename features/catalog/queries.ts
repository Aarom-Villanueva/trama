import "server-only";
import { cache } from "react";
import { listPublishedProducts } from "../products/repository";
import { toStoreProduct } from "./model";
export const getPublicCatalog = cache(async () => (await listPublishedProducts()).map(toStoreProduct));
