# Arquitectura de TRAMA

Una aplicación Next.js 16.3.4, React 19.2.6 y TypeScript 5.9.3. npm y su lockfile
son el gestor y fuente de versiones. No se ejecuta sobre Vinext, D1 ni Workers.

## Superficie pública actual

- `app/`: inicio, catálogo, detalle por slug, bolsa, metadata y composición.
- `data/products.ts`: fixture del seed; ninguna ruta pública lee este array.
- `features/catalog/queries.ts`: consulta pública compartida en servidor.
- `features/catalog/catalog-provider.tsx`: DTO publicado compartido en navegador.
- `app/api/catalog/route.ts`: refresco público sin caché persistente.
- `data/catalog-presentation.ts`: orden de destacados compartido por inicio y seed.
- `features/catalog/`: filtros URL, detalle, galería y herramientas de lectura.
- `features/bag/`: selección en `localStorage`, cantidades y subtotal de consulta.
- `components/`, `app/globals.css`: presentación y componentes reutilizables.
- `public/images/`: 24 fotos de prendas y dos imágenes de campaña.
- `lib/store-config.ts`: configuración demostrativa; número WhatsApp vacío.

Los filtros, slugs, fotos y destacados se conservan en PostgreSQL. La bolsa usa
IDs de variante y reconcilia datos antiguos o retirados del catálogo.
`app/chatgpt-auth.ts` y `examples/d1/` son residuos no utilizados del starter;
el ejemplo no es una ruta activa y está excluido de TypeScript. No son una
solución de autenticación o persistencia para este despliegue.

## Persistencia activa

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
- `created_at` y `updated_at` inicializan al insertar. El servicio de escritura
  actualiza timestamps y comprueba/incrementa `version` bajo bloqueo de fila.

`features/products/validation.ts` valida entradas con Zod; `service.ts` autoriza
y persiste el agregado en transacción. `actions.ts` revalida permisos por petición.
`db/schema/auth.ts` define usuarios, cuentas, sesiones, verificaciones, límite de
peticiones y acceso administrativo. No hay tablas de ventas o suscripciones.

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

## Autenticación y administración

Better Auth 1.7.6 y su adaptador Drizzle 1.7.6 gestionan Google y las sesiones;
Zod 4.6.5 satisface el peer de better-call 1.4.0. Next y React mantienen versiones.
`lib/auth.ts` configura el proveedor y los hooks; `lib/require-admin.ts` verifica
sesión y acceso a través de `lib/admin-policy.ts` en cada lectura y escritura.
Solo el correo verificado configurado puede darse de alta, con permiso adicional
en la base. Una sesión sola no basta. No hay autenticación criptográfica propia.

`app/admin/(protected)` protege panel y formularios; `/admin/login` es público.
`features/admin/` contiene UI y usa tipos de entrada separados del ORM.
La previsualización requiere autorización antes de leer borradores. Los límites
de publicación se verifican en servidor aunque el cliente se manipule.

Ver [operación local, revocación y pruebas](docs/admin-local.md). El propietario
confirmó el OAuth real y el flujo administrativo local; la evidencia automática
y manual se distingue en [verification-admin.md](docs/verification-admin.md).
Quedan pendientes almacenamiento externo y preparación de un entorno de Preview
con su propia base. El sistema sigue siendo de una tienda.
