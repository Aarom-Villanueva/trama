import Link from 'next/link';
import {Button} from '@/components/ui/button';
export default function NotFound(){return <main id="main" className="wrap not-found"><span className="eyebrow">404 / FUERA DE COLECCIÓN</span><h1>Esta página no está por aquí.</h1><p>La colección te espera al otro lado.</p><Button asChild className="action"><Link href="/catalogo">Volver a la colección</Link></Button></main>}
