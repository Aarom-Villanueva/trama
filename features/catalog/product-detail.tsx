"use client";
import Link from "next/link";
import { useState } from "react";
import { type StoreProduct, money } from "./model";
import { useCatalog } from "./catalog-provider";
import { useBag } from "../bag/bag-provider";
import { Button } from "@/components/ui/button";
import { QuantityPicker } from "@/components/catalog/quantity-picker";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
export function ProductDetail({ product, preview = false }: { product: StoreProduct; preview?: boolean }) {
  const { products } = useCatalog();
  const p = preview ? product : products.find((p) => p.id === product.id);
  const [colorId, setColor] = useState(product.colors[0]?.id ?? "");
  const [size, setSize] = useState(""); const [view, setView] = useState(0);
  const [quantity, setQuantity] = useState(1); const [added, setAdded] = useState(false); const [guide, setGuide] = useState(false);
  const bag = useBag();
  if (!p) return <main id="main" className="wrap not-found"><h1>Esta prenda ya no está publicada.</h1><Link href="/catalogo">Volver al catálogo</Link></main>;
  const color = p.colors.find((c) => c.id === colorId) ?? p.colors[0];
  const variants = p.variants.filter((v) => v.colorId === color?.id);
  const variant = variants.find((v) => v.sizeCode === size);
  const photos = p.images.filter((i) => !i.colorId || i.colorId === color?.id);
  const gallery = photos.length ? photos : p.images;
  const photo = gallery[view] ?? gallery[0];
  const max = variant?.maxQuantity ?? 99;
  const count = Math.max(1, Math.min(quantity, max));
  return <main id="main" className="product-page wrap"><div className="breadcrumb"><Link href="/">Inicio</Link> / <Link href={"/catalogo?coleccion=" + p.gender}>{p.gender}</Link> / {p.name}</div>
    {preview && <p className="success-notice">Vista previa administrativa. Esta pantalla no publica ni añade productos a la bolsa.</p>}
    <div className="product-detail"><div className="product-gallery"><div className="thumbnails">{gallery.map((image, index) => <button className="thumb" type="button" key={image.url} onClick={() => setView(index)} aria-label={"Ver foto " + (index + 1)} aria-pressed={photo?.url === image.url}><img src={image.url} alt={image.alt} width="896" height="1200" /></button>)}</div><div className="gallery-main">{photo ? <img src={photo.url} alt={photo.alt} width="896" height="1200" /> : <p>Selecciona fotos para esta prenda.</p>}<span className="gallery-caption">{gallery.indexOf(photo) + 1} / {gallery.length}</span>{gallery.length > 1 && <Button className="gallery-next" variant="ghost" onClick={() => setView((gallery.indexOf(photo) + 1) % gallery.length)} aria-label="Cambiar vista de la prenda">↔</Button>}</div></div>
    <div className="product-info"><p className="eyebrow">COLECCIÓN / {p.gender.toUpperCase()}</p><h1>{p.name}</h1><p className="detail-price">{money(p.priceMinor)}</p><p className="product-description">{p.description}</p><div className="size-heading">Color: {color?.name}</div><div className="size-radios" role="group" aria-label="Color">{p.colors.map((c) => <button type="button" className={"size-option " + (c.id === color?.id ? "selected" : "")} key={c.id} aria-pressed={c.id === color?.id} onClick={() => { setColor(c.id); setSize(""); setView(0); setAdded(false); }} style={{ padding: "0 12px" }}>{c.name}</button>)}</div>
    <div className="size-heading"><span>Selecciona tu talla</span><button type="button" onClick={() => setGuide(true)}>Guía de tallas</button></div><div className="size-radios" role="group" aria-label="Talla">{variants.map((v) => <button type="button" key={v.id} className={"size-option " + (v.sizeCode === size ? "selected" : "")} aria-pressed={v.sizeCode === size} disabled={v.availability === "out_of_stock"} onClick={() => { setSize(v.sizeCode); setAdded(false); }}>{v.sizeCode}{v.availability === "out_of_stock" ? " · Agotada" : ""}</button>)}</div><p className="size-hint">{size ? "Talla " + size + " seleccionada" : "Elige una talla para añadir la prenda."}</p>
    <div className="buy-actions"><QuantityPicker value={count} max={max} onChange={(q) => { setQuantity(q); setAdded(false); }} /><Button className="action" disabled={preview || !variant || variant.availability === "out_of_stock" || !bag.ready} onClick={() => { if (variant) { bag.add({ variantId: variant.id, quantity: count }); setAdded(true); } }}>{added ? "Añadido a tu bolsa" : "Añadir a mi bolsa"}</Button></div>{added && <p role="status" className="success-notice">Tu selección está guardada. <Link href="/bolsa">Ver bolsa →</Link></p>}<p className="availability">{variant?.availability === "out_of_stock" ? "Agotado." : variant?.availability === "available" ? "Disponibilidad indicada para esta demo. Envío por confirmar." : "Disponibilidad y envío por confirmar."}</p><details><summary>Detalles de la prenda</summary><p>Corte {p.fit.toLowerCase()}. Colección de demostración.</p></details><details><summary>¿Cómo hago mi consulta?</summary><p>Selecciona talla y cantidad y prepara tu consulta por WhatsApp. La bolsa no reserva stock ni confirma una compra.</p></details></div></div>
    <Sheet open={guide} onOpenChange={setGuide}><SheetContent className="guide-sheet"><SheetHeader><SheetTitle>Encuentra tu talla.</SheetTitle><SheetDescription>{p.name} · Corte {p.fit}</SheetDescription></SheetHeader><p>Compara una prenda que ya te quede bien sobre una superficie plana. Incluye sus medidas en tu consulta para confirmar la talla adecuada.</p><p>Tallas de demostración: {p.sizes.join(", ")}. No hay una tabla de fabricación verificada.</p><Button onClick={() => setGuide(false)}>Volver a la prenda</Button></SheetContent></Sheet>
  </main>;
}
