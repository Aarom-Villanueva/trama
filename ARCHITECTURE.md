# TRAMA — catálogo conceptual

Proyecto independiente. React, TypeScript y rutas App Router sobre el starter Vinext de Sites. No se utiliza el runtime de exportación de Claude Design.

## Organización

- `app/`: rutas, metadata y composición global. Inicio, catálogo, producto por slug, bolsa y 404.
- `data/products.ts`: colección tipada de 12 productos y rutas a sus 24 fotografías. Precios, tallas y descripciones son demostrativos.
- `features/catalog/`: filtros sincronizados con la URL, galería y selección de talla. Las funciones WebMCP de lectura usan los mismos datos y bolsa.
- `features/bag/`: estado local de selección, validación, cantidades y subtotal. El proveedor conserva la selección en localStorage después de cargarla; no simula inventario real.
- `components/catalog/`: tarjeta y selector de cantidad reutilizables.
- `components/layout/`: encabezado con búsqueda y pie compartidos.
- `components/ui/`: primitivas accesibles del starter, conservadas sin modificar.
- `lib/store-config.ts`: nombre y número de WhatsApp del negocio.
- `public/images/`: 26 copias WebP optimizadas a partir de los archivos del usuario. Los originales permanecen en el ZIP de origen.
- `app/globals.css`: tokens de marca, composición y reglas responsive.

## Comportamiento

El catálogo guarda filtros en parámetros URL, para que puedan compartirse y usarse con atrás/adelante. Cada prenda tiene una URL propia y dos vistas. La selección necesita una talla válida y limita las cantidades a 1–99. Las líneas se distinguen por producto y talla.

WhatsApp recibe un texto con productos, tallas, cantidades y subtotal; no hay pago, reserva ni confirmación de pedido. Al no haberse proporcionado un número comercial, el enlace permite al visitante elegir destinatario. Para adaptar la demo a una tienda, establecer `whatsappNumber` en formato internacional, solo dígitos. No usar el teléfono personal del desarrollador sin su autorización.

## Evolución hacia un catálogo administrable

La siguiente fase sustituiría la fuente local de productos por persistencia y añadiría autenticación de administradores, validación en servidor y almacenamiento de fotos. No se ha creado un backend ficticio ni se presenta esta demo como una tienda con stock sincronizado.

## Desarrollo

Utilizar el gestor y lockfile declarados por el proyecto: `pnpm install`, `pnpm dev`, `pnpm build`. Node según `package.json`. El starter contiene adaptadores de ejecución para el entorno de Sites; leer su README para el despliegue. No incluir credenciales en el código.

## Revisión funcional

Comprobar: 12 prendas, 6 por colección; búsqueda con acentos; filtros sin resultados; galería frente/espalda; talla obligatoria; suma de misma talla y separación de tallas distintas; persistencia tras recarga; eliminación y bolsa vacía; texto y subtotal de WhatsApp; navegación con teclado y diseño móvil.
