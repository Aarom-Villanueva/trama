"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="admin-notice"><h2>No pudimos cargar esta página.</h2><p>Comprueba la conexión local y vuelve a intentarlo.</p><button type="button" onClick={reset}>Reintentar</button></section>; }
