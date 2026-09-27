"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeProductStatus } from "../products/actions";
import { money } from "../catalog/model";
import { Button } from "@/components/ui/button";
type Row = { id: string; name: string; slug: string; status: "draft" | "published" | "archived"; priceMinor: number; version: number };
const labels = { draft: "Borrador", published: "Publicado", archived: "Archivado" };
export function AdminList({ products }: { products: Row[] }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all"); const [error, setError] = useState(""); const [pending, start] = useTransition(); const router = useRouter();
  const normalized = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visible = products.filter((p) => (status === "all" || p.status === status) && normalized(p.name + " " + p.slug).includes(normalized(query)));
  const change = (row: Row, status: Row["status"]) => start(async () => { setError(""); const result = await changeProductStatus({ id: row.id, version: row.version, status }); if (!result.ok) setError(result.error); else router.refresh(); });
  return <><div className="admin-title"><div><p className="eyebrow">TU COLECCIÓN</p><h1>Prendas<em>.</em></h1></div><Button asChild className="action"><Link href="/admin/products/new">Crear prenda +</Link></Button></div><div className="admin-filters"><label>Buscar<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre o URL" /></label><label>Estado<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Todos</option>{Object.entries(labels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label></div>{error && <p className="admin-error" role="alert">{error}</p>}<p className="admin-count" role="status">{visible.length} prendas</p><div className="admin-list">{visible.map((p) => <article className="admin-row" key={p.id}><div><span className={"admin-badge " + p.status}>{labels[p.status]}</span><h2><Link href={"/admin/products/" + p.id}>{p.name}</Link></h2><p>{money(p.priceMinor)} · /producto/{p.slug}</p></div><div className="admin-row-actions"><Link href={"/admin/products/" + p.id}>Editar</Link><Link href={"/admin/products/" + p.id + "/preview"}>Previsualizar</Link><Button disabled={pending} variant="outline" onClick={() => change(p, p.status === "published" ? "draft" : "published")}>{p.status === "published" ? "Despublicar" : "Publicar"}</Button>{p.status !== "archived" && <Button disabled={pending} variant="ghost" onClick={() => change(p, "archived")}>Archivar</Button>}</div></article>)}</div>{!visible.length && <div className="empty-state"><h2>No hay prendas para esta búsqueda.</h2><p>Cambia los filtros o crea la primera prenda.</p></div>}</>;
}
