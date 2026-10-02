import Link from 'next/link';
export function SiteFooter(){const year=new Date().getFullYear();return <footer className="site-footer"><div className="wrap">
  <div className="footer-grid">
    <div className="footer-brand">
      <Link href="/" className="footer-wordmark" aria-label="TRAMA, volver al inicio">TRAMA</Link>
      <p>Esenciales para vestir a tu manera.</p>
    </div>
    <div className="footer-col">
      <h3>Colección</h3>
      <nav aria-label="Colecciones"><Link href="/catalogo?coleccion=mujer">Mujer</Link><Link href="/catalogo?coleccion=hombre">Hombre</Link><Link href="/catalogo">Ver colección</Link></nav>
    </div>
    <div className="footer-col">
      <h3>Ayuda</h3>
      <nav aria-label="Ayuda"><Link href="/bolsa">Mi bolsa</Link></nav>
      <p className="footer-help-text">Disponibilidad y envío por confirmar. No se realiza ningún cobro ni reserva.</p>
      <p className="footer-help-text">Proyecto conceptual · Productos, imágenes y precios de demostración.</p>
    </div>
  </div>
  <div className="footer-bottom"><span>© {year} TRAMA</span><a href="https://aaromdev.vercel.app/" target="_blank" rel="noopener noreferrer">Diseñado y desarrollado por Aarom</a></div>
</div></footer>}
