"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useCatalog } from "../catalog/catalog-provider";
import { money, type StoreProduct } from "../catalog/model";
import { reconcileSelection, type BagItem } from "./selection";
export type { BagItem } from "./selection";
export const BAG_KEY = "trama-selection-v2";
type BagLine = { item: BagItem; product: StoreProduct; variant: StoreProduct["variants"][number]; color: string };
type BagContext = { items: BagItem[]; lines: BagLine[]; ready: boolean; adjusted: boolean; add: (item: BagItem) => void; change: (variantId: string, quantity: number) => void; remove: (variantId: string) => void; count: number; subtotal: number; message: string };
const Context = createContext<BagContext | null>(null);
export function BagProvider({ children }: { children: React.ReactNode }) {
  const { products } = useCatalog();
  const [stored, setStored] = useState<unknown>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate browser storage after SSR, before persistence is enabled.
      setStored(JSON.parse(localStorage.getItem(BAG_KEY) ?? localStorage.getItem("trama-selection-v1") ?? "[]"));
    } catch { setStored([]); }
    setReady(true);
  }, []);
  const items = reconcileSelection(stored, products);
  const serialized = JSON.stringify(items);
  useEffect(() => { if (ready) try { localStorage.setItem(BAG_KEY, serialized); } catch {} }, [serialized, ready]);
  const lines = items.flatMap((item): BagLine[] => {
    const product = products.find((p) => p.variants.some((v) => v.id === item.variantId));
    const variant = product?.variants.find((v) => v.id === item.variantId);
    return product && variant ? [{ item, product, variant, color: product.colors.find((c) => c.id === variant.colorId)?.name ?? "" }] : [];
  });
  const add = (item: BagItem) => setStored((old: unknown) => reconcileSelection([...reconcileSelection(old, products), item], products));
  const change = (variantId: string, quantity: number) => { if (Number.isInteger(quantity) && quantity > 0) setStored((old: unknown) => reconcileSelection(old, products).map((item) => item.variantId === variantId ? { ...item, quantity } : item)); };
  const remove = (variantId: string) => setStored((old: unknown) => reconcileSelection(old, products).filter((item) => item.variantId !== variantId));
  const subtotal = lines.reduce((sum, line) => sum + line.product.priceMinor * line.item.quantity, 0);
  const message = ["Hola, quisiera consultar esta selección de TRAMA (demostración):", "", ...lines.map(({ item, product, variant, color }) => item.quantity + " × " + product.name + " — " + color + " — Talla " + variant.sizeCode + " — " + money(product.priceMinor * item.quantity)), "", "Subtotal referencial: " + money(subtotal), "¿Podrían confirmarme disponibilidad y costo de envío?"].join("\n");
  const adjusted = Array.isArray(stored) && (stored.length !== items.length || stored.some((raw) => raw?.variantId && items.find((i) => i.variantId === raw.variantId)?.quantity !== raw.quantity));
  return <Context.Provider value={{ items, lines, ready, adjusted, add, change, remove, subtotal, message, count: items.reduce((sum, item) => sum + item.quantity, 0) }}>{children}</Context.Provider>;
}
export function useBag() { const value = useContext(Context); if (!value) throw new Error("BagProvider missing"); return value; }
