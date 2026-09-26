import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { products } from '@/data/products';
import { featuredProductSlugs } from '@/data/catalog-presentation';
import { ProductCard } from '@/components/catalog/product-card';
export default function Home() {
  return <main id="main">
    <section className="home-intro wrap"><div><p className="eyebrow">TRAMA / COLECCIÓN ESENCIAL</p><h1>Lo simple.<br className="mobile-break"/> <em>Lo que eres.</em></h1></div><p className="intro-note">Prendas que combinan contigo.<br/>Y con todos tus días.</p></section>
    <section className="campaign-grid wrap" aria-label="Explorar colecciones">
      {(['mujer','hombre'] as const).map((gender,i)=><Link key={gender} href={'/catalogo?coleccion='+gender} className={'campaign campaign-'+gender}>
        <img src={'/images/campana-'+(i===0?'mujer-marfil-arena':'hombre-negro-indigo')+'.webp'} alt={i===0?'Colección Mujer: top marfil y pantalón amplio arena':'Colección Hombre: polo negro y jean índigo'} width="960" height="1200" loading={i===0?'eager':'lazy'}/>
        <div className="campaign-label"><div><span className="eyebrow">06 PRENDAS / UNA COLECCIÓN</span><h2>{i===0?'Mujer':'Hombre'}</h2></div><span className="campaign-cta"><span>Explorar</span><ArrowUpRight size={22}/></span></div>
      </Link>)}
    </section>
    <section className="featured wrap"><div className="section-heading"><div><p className="eyebrow">EL PUNTO DE PARTIDA</p><h2>Tus próximos <em>esenciales.</em></h2></div><Link className="text-link" href="/catalogo">Ver la colección <ArrowRight size={18}/></Link></div><div className="product-grid">{featuredProductSlugs.map(slug=><ProductCard key={slug} product={products.find(p=>p.slug===slug)!}/>)}</div></section>
    <section className="collection-note wrap"><span className="eyebrow">MENOS RUIDO. MÁS TÚ.</span><p>Doce prendas.<br/>Infinitas formas de <em>combinarlas.</em></p><Link className="text-link" href="/catalogo">Encuentra las tuyas <ArrowUpRight size={18}/></Link></section>
  </main>
}
