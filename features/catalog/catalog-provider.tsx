"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { StoreProduct } from "./model";
const Context = createContext<{ products: StoreProduct[]; refresh: () => Promise<void> } | null>(null);
export function CatalogProvider({ products: initial, children }: { products: StoreProduct[]; children: React.ReactNode }) {
  const [data, setData] = useState({ initial, products: initial });
  if (data.initial !== initial) setData({ initial, products: initial });
  const path = usePathname();
  async function refresh() {
    try { const response = await fetch("/api/catalog", { cache: "no-store" }); if (response.ok) { const products: StoreProduct[] = await response.json(); setData((old) => ({ ...old, products })); } } catch { /* Keep the last public snapshot on temporary network failure. */ }
  }
  useEffect(() => {
    const controller = new AbortController();
    const update = async () => { try { const response = await fetch("/api/catalog", { cache: "no-store", signal: controller.signal }); if (response.ok) { const products: StoreProduct[] = await response.json(); setData((old) => ({ ...old, products })); } } catch {} };
    void update(); const interval = setInterval(() => void update(), 30000);
    window.addEventListener("focus", update);
    return () => { controller.abort(); clearInterval(interval); window.removeEventListener("focus", update); };
  }, [path]);
  return <Context.Provider value={{ products: data.products, refresh }}>{children}</Context.Provider>;
}
export function useCatalog() { const value = useContext(Context); if (!value) throw new Error("CatalogProvider missing"); return value; }
