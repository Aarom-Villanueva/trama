"use client";
import Link from "next/link";
import { useState } from "react";
import { useBag } from "./bag-provider";
import { money } from "../catalog/model";
import { whatsappHref, storeConfig } from "@/lib/store-config";
import { QuantityPicker } from "@/components/catalog/quantity-picker";
import { Button } from "@/components/ui/button";
export function BagPage() {
  const bag = useBag(); const [status, setStatus] = useState("");
  return <main id="main" className="bag-page wrap"><div className="breadcrumb"><Link href="/">Inicio</Link> / Mi bolsa</div><div className="bag-title"><h1>Tu selección<em>.</em></h1><Link href="/catalogo">Seguir explorando →</Link></div>
    {bag.adjusted && <p role="status" className="success-notice">Actualizamos la selección: una prenda ya no está publicada o su disponibilidad cambió.</p>}
    {!bag.ready ? <p role="status">Cargando selección…</p> : !bag.items.length ? <div className="empty-state"><h2>Todo empieza con una prenda.</h2><p>Tu bolsa está vacía.</p><Link href="/catalogo">Explorar la colección →</Link></div> : <div className="bag-layout"><section aria-label="Prendas seleccionadas">{bag.lines.map(({ item, product: p, variant, color }) => <article className="bag-item" key={item.variantId}>
      <Link href={"/producto/" + p.slug}><img src={p.photos.front} alt={p.name + " " + color} width="896" height="1200" /></Link><div className="bag-item-info"><Link href={"/producto/" + p.slug}>{p.name}</Link><p>{color} / Talla {variant.sizeCode}</p><p>{money(p.priceMinor)} por prenda</p><QuantityPicker value={item.quantity} max={variant.maxQuantity} label={p.name + ", talla " + variant.sizeCode} onChange={(q) => bag.change(item.variantId, q)} /></div><div className="bag-item-side"><span>{money(p.priceMinor * item.quantity)}</span><Button variant="ghost" onClick={() => bag.remove(item.variantId)}>Eliminar</Button></div></article>)}</section>
      <aside className="bag-summary"><h2>Casi tuyos.</h2><div className="summary-row"><span>Selección</span><span>{bag.count} prendas</span></div><div className="summary-row"><span>Envío</span><span>Por confirmar</span></div><div className="summary-row total"><span>Subtotal</span><span>{money(bag.subtotal)}</span></div><Button asChild className="action"><a href={whatsappHref(bag.message)} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a></Button><p>Disponibilidad y envío por confirmar. No se realiza ningún cobro ni reserva.</p>{!storeConfig.whatsappNumber && <p>Demo: WhatsApp te permitirá elegir a quién enviar la consulta.</p>}<details><summary>Ver el mensaje de mi consulta</summary><pre>{bag.message}</pre><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(bag.message); setStatus("Mensaje copiado."); } catch { setStatus("Puedes seleccionar y copiar el texto de arriba."); } }}>Copiar mensaje</Button><p role="status">{status}</p></details></aside></div>}
  </main>;
}
