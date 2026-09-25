import type {Metadata} from 'next';
import './globals.css';
import {BagProvider} from '@/features/bag/bag-provider';
import {SiteHeader} from '@/components/layout/site-header';
import {SiteFooter} from '@/components/layout/site-footer';
import {CatalogTools} from '@/features/catalog/catalog-tools';
import {Suspense} from 'react';
import {RouteTransition,TransitionOverlay} from '@/components/layout/route-transition';
export const metadata:Metadata={title:{default:'TRAMA — Lo simple. Lo que eres.',template:'%s · TRAMA'},description:'Explora la colección esencial de TRAMA para mujer y hombre. Catálogo conceptual con selección de prendas y consulta por WhatsApp.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es" data-scroll-behavior="smooth"><body><BagProvider><Suspense fallback={<TransitionOverlay/>}><RouteTransition/></Suspense><CatalogTools/><SiteHeader/>{children}<SiteFooter/></BagProvider></body></html>}
