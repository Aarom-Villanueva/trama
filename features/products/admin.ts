import "server-only";
import { getDatabase } from "../../db";
import { requireAdmin } from "../../lib/require-admin";
import { productService } from "./service";
export const adminProducts = () => productService(getDatabase(), requireAdmin);
