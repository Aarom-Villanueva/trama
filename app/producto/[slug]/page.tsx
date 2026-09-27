import {getPublicCatalog} from '@/features/catalog/queries';
export const dynamic='force-dynamic';
import {notFound} from 'next/navigation';
import {ProductDetail} from '@/features/catalog/product-detail';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=(await getPublicCatalog()).find(p=>p.slug===slug);return {title:p?`${p.name} ${p.color}`:'Prenda no encontrada',description:p?.description}}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=(await getPublicCatalog()).find(p=>p.slug===slug);if(!p)notFound();return <ProductDetail key={p.slug} product={p}/>}
