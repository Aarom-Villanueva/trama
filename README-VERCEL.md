# TRAMA — catálogo de ropa

Proyecto Next.js independiente listo para ejecutarse localmente y publicarse en Vercel.

## Ejecutarlo en Windows

1. Instala Node.js 22 LTS desde nodejs.org.
2. Extrae esta carpeta.
3. Abre una terminal dentro de `trama-catalogo`.
4. Ejecuta:

```bash
npm install
npm run dev
```

5. Abre http://localhost:3000

## Publicarlo en Vercel

1. Crea un repositorio nuevo y sube el contenido de esta carpeta.
2. En Vercel elige **Add New Project** y selecciona ese repositorio.
3. Framework: **Next.js**.
4. Build command: `npm run build`.
5. Output directory: déjalo vacío.
6. Pulsa **Deploy**.

## Qué incluye

- Inicio con campañas Mujer y Hombre.
- Catálogo de 12 prendas, filtros y búsqueda.
- Fichas con fotos de frente y espalda.
- Selección de talla y cantidad.
- Bolsa persistente en el navegador.
- Consulta preparada para WhatsApp.

Los precios, el nombre TRAMA y el número de WhatsApp son demostrativos. Para un negocio real, edita `data/products.ts` y `lib/store-config.ts`. No hay pagos, reservas ni stock real en esta versión.
