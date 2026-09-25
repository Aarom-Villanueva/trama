import {getProduct,products} from '@/data/products';
import {notFound} from 'next/navigation';
import {ProductDetail} from '@/features/catalog/product-detail';
export function generateStaticParams(){return products.map(p=>({slug:p.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=getProduct(slug);return {title:p?`${p.name} ${p.color}`:'Prenda no encontrada',description:p?.description}}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=getProduct(slug);if(!p)notFound();return <ProductDetail key={p.slug} product={p}/>}
