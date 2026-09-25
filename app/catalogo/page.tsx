import {Suspense} from 'react';
import {Catalog} from '@/features/catalog/catalog';
export const metadata={title:'La colección'};
export default function CatalogPage(){return <Suspense fallback={<main id="main" className="wrap page-intro"><h1>La colección</h1><p>Cargando prendas…</p></main>}><Catalog/></Suspense>}
