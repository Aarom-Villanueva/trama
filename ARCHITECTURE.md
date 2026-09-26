# Arquitectura de TRAMA

Una aplicación Next.js 16.3.4, React 19.2.6 y TypeScript 5.9.3. npm y su lockfile
son el gestor y fuente de versiones. No se ejecuta sobre Vinext, D1 ni Workers.

## Superficie pública actual

- `app/`: inicio, catálogo, detalle por slug, bolsa, metadata y composición.
- `data/products.ts`: fuente activa para todas las rutas y WebMCP.
- `data/catalog-presentation.ts`: orden de destacados compartido por inicio y seed.
- `features/catalog/`: filtros URL, detalle, galería y herramientas de lectura.
- `features/bag/`: selección en `localStorage`, cantidades y subtotal de consulta.
- `components/`, `app/globals.css`: presentación y componentes reutilizables.
- `public/images/`: 24 fotos de prendas y dos imágenes de campaña.
- `lib/store-config.ts`: configuración demostrativa; número WhatsApp vacío.

El import compartido de destacados no añade acceso a PostgreSQL. Los filtros,
slugs, fotos, selección de talla y consulta por WhatsApp conservan su fuente.
`app/chatgpt-auth.ts` y `examples/d1/` son residuos no utilizados del starter;
el ejemplo no es una ruta activa y está excluido de TypeScript. No son una
solución de autenticación o persistencia para este despliegue.

## Persistencia preparada, todavía desconectada de las rutas

- `db/schema/catalog.ts`: cinco tablas, enums, claves e integridad SQL.
- `db/client.ts`: fábrica de conexión Drizzle/pg, marcada `server-only`.
- `db/index.ts`: acceso diferido; no abre conexiones durante un build público.
- `features/products/repository.ts`: lectura de productos publicados en una
  transacción coherente de solo lectura; no exporta filas completas de la base.
- `features/products/types.ts`: contrato público independiente del ORM;
  disponibilidad como `to_confirm`, `out_of_stock` o `available`.
- `drizzle.config.ts`, `drizzle/`: generación sin credenciales y migraciones SQL.
- `scripts/lib/local-db.ts`: protección de comandos locales y errores sin secretos.
- `scripts/lib/catalog-fixture.ts`, `scripts/lib/seed.ts`: conversión e importación.
- `tests/`: reglas de conversión/aislamiento y pruebas sobre PostgreSQL real.

## Modelo y restricciones

`category` → `product` → `product_color`, `product_variant`, `product_image`.
Producto es la prenda; variante es una combinación talla/color con SKU propio.
UUID identifica filas; `import_key` identifica su origen y no debe editarse.

- Slug único de categoría y producto, normalizado en minúsculas.
- SKU global único y normalizado en mayúsculas; combinación
  `(product_id, color_id, size_code)` única.
- FK compuestas aseguran que el color de una variante o imagen pertenezca al
  mismo producto. Una imagen puede no asociarse a un color, pero siempre a un producto.
- `price_minor` es entero en céntimos, no negativo; `currency` es PEN.
  La conversión valida texto decimal y usa enteros, sin redondear punto flotante.
- `stock` es entero no negativo o NULL. NULL solo significa disponibilidad
  desconocida. No autoriza una futura venta ni reserva.
- Estado `draft`, `published`, `archived`; no hay borrado en cascada.
- `position` conserva orden de productos, categorías, tallas, colores e imágenes;
  `featured_position` conserva el orden de destacados y es único cuando existe.
- `created_at` y `updated_at` inicializan al insertar. La futura capa de escritura
  deberá actualizar `updated_at` y comprobar/incrementar `version` explícitamente;
  no hay un trigger ni operaciones administrativas implementadas aún.

Las comprobaciones de publicación entre varias tablas corresponderán al futuro
servicio de negocio. No existen aún tablas de usuarios, ventas o suscripciones.

## Importación

El fixture lee las fuentes actuales. Claves deterministas con prefijo
`trama-demo:v1:`; SKU derivado de slug y talla (cada producto actual tiene un color).
El orden del array determina `position`; las fotos mantienen sus URLs locales.

El seed obtiene un bloqueo transaccional para serializar sus propias ejecuciones.
Inserta categorías faltantes por `import_key` y cada producto nuevo con todos sus
hijos dentro de una única transacción. Si ya existe la identidad de importación
del producto, omite toda esa unidad: no modifica el producto ni reintroduce hijos
eliminados por una edición posterior. Una colisión de slug/SKU con otra identidad
falla y revierte la transacción; no adopta registros silenciosamente.

El seed no es una herramienta de sincronización ni reparación. Cambios futuros
en la demo requieren una migración explícita. Se deben archivar productos, en vez
de borrar físicamente toda una unidad importada, si no se desea reimportarla.

## Siguiente etapa

Añadir Better Auth y autorización de administrador, reglas de escritura y panel.
Después coordinar el cambio de fuente de inicio, catálogo, detalle, bolsa y WebMCP,
incluyendo IDs de variante, disponibilidad desconocida y estrategia de caché.
Los uploads y almacenamiento externo se incorporarán en su etapa autorizada.
La base actual es para una tienda; todavía no incorpora aislamiento multiempresa.
