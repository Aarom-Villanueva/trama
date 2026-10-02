# Verificación local del hito administrativo

Fecha: 2026-09-26. Rama: `feature/trama-backend-foundation`. Build de producción
ejecutado localmente con `npm run start -- --hostname 127.0.0.1` en puerto 3000.
PostgreSQL dedicado local; sin servicios cloud ni cambios de producción.

## Resultados ejecutados

| Prueba | Resultado |
| --- | --- |
| Typecheck | Pasó |
| Lint | 0 errores, 8 advertencias `@next/next/no-img-element` |
| Build | Pasó; rutas de aplicación dinámicas |
| Unitarias | 5/5 |
| Integración PostgreSQL | 16/16 (15 escenarios y contenedor de prueba) |
| Migraciones desde base vacía, repetición y seed | Pasaron en una base temporal eliminada al terminar |
| Inicio `/` | 12 prendas, 4 destacados, precios e imágenes visibles |
| `/catalogo` | Colección, categoría, talla, precio y orden descendente probados |
| Búsqueda | `indigo` encuentra Índigo; búsqueda inexistente devuelve estado vacío; limpiar restaura catálogo |
| Detalle importado | Foto frente/espalda, talla M, cantidad y añadido a bolsa probados |
| Bolsa | Cantidad, subtotales, recarga persistente y eliminación probados; selección previa conservada |
| WebMCP | Búsqueda filtrada devuelve precio PEN 49; selección devuelve IDs de variante y subtotal coherente |
| `/admin` sin sesión | HTTP 307 a `/admin/login?denied=0`, verificado también en navegador |
| `/admin/products/new` sin sesión | HTTP 307 al login |
| `/admin/login` | HTTP 200; aviso de configuración incompleta y Google deshabilitado |
| Server Actions sin cookie / cookie inválida | Las dos acciones devuelven `ok: false` e «Inicia sesión para continuar.» |
| Endpoint de registro | HTTP 403 |
| Endpoint de sesión sin configurar OAuth | HTTP 503 controlado |
| Slug inexistente | HTTP 404 |
| Consola / hidratación | No se observaron errores ni advertencias en las rutas visitadas |

Las Server Actions usan HTTP 200 para transportar el resultado denegado; eso no
significa que la escritura se autorizó. Se comprobaron `saveProduct` y
`changeProductStatus` por HTTP usando los identificadores del build actual.

La API pública devolvió 12 productos y 57 variantes `to_confirm`, con
`Cache-Control: no-store`. El manifiesto de pre-render contiene únicamente
`/_global-error`, una ruta interna de Next.js; ninguna ruta pública del catálogo
está pre-renderizada. Se probaron enlaces internos por teclado, filtros, cambio
de URL y recargas; no se observó un fallo de navegación de la aplicación.

La prueba de bolsa añadió temporalmente dos unidades de Polo camisero Oliva M:
con el Top básico existente el subtotal fue S/ 207.00; al reducir a una unidad,
S/ 128.00. Se eliminó únicamente la línea añadida por la prueba y quedó la
selección anterior de S/ 49.00. No se envió ningún mensaje por WhatsApp.

## Límites de la primera verificación (2026-09-26)

En esa primera verificación faltaban `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
y `TRAMA_ADMIN_EMAIL`.
El secreto local y la URL base se prepararon en `.env.local` sin imprimirlos.
No se inició ni se simuló un OAuth real. El formulario administrativo autenticado
y su recorrido visual completo quedaron pendientes en esa primera verificación.

Las pruebas de autorización y CRUD exitoso se ejecutaron contra PostgreSQL real
en la base temporal, con identidades sintéticas y cookies firmadas mediante la
biblioteca Better Auth. Esto cubre permisos, revocación, validaciones y
publicación/edición, pero no prueba la comunicación con Google. Consultar
[configuración y recorrido manual](admin-local.md).

El escaneo de archivos versionados y nuevos no encontró valores de los secretos
locales. `.env.local`, `node_modules` y `.next` están ignorados; el volumen Docker
no se almacena dentro del repositorio. `.env.example` conserva solo valores
ficticios. En esa primera verificación no se hizo commit, push, merge ni despliegue.

## Confirmación manual posterior y checkpoint (2026-09-27)

El propietario confirmó que configuró Google en `.env.local` y completó el
OAuth real con la cuenta autorizada, acceso al panel, creación de borrador,
ocultación pública, publicación, edición, archivo y cierre de sesión.
Esta es evidencia manual comunicada por el propietario, no un OAuth automatizado.
No se ha registrado una confirmación manual de cuenta Google ajena o revocación.

Las imágenes siguen siendo 24 fotos de prendas y dos campañas versionadas en
`public/images`; PostgreSQL conserva las rutas en `product_image.url`. El panel
selecciona imágenes existentes y no sube archivos ni usa almacenamiento externo.

El checkpoint se prepara en `feature/trama-backend-foundation`. Su configuración
`git.deploymentEnabled` deshabilita despliegues automáticos de esa rama en Vercel;
no se mezcla con `main` ni se despliega esta etapa.

Comprobaciones repetidas para este checkpoint:

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Pasó |
| `npm test` | 5/5 |
| `npm run test:integration` | 16/16; base temporal aislada eliminada al terminar |
| `npm run lint` | 0 errores, 8 advertencias `@next/next/no-img-element` |
| `npm run build` | Pasó; rutas de aplicación dinámicas |
| `git diff --check` | Pasó |

Estas pruebas no modifican las 12 prendas del catálogo local ni las fotos
versionadas. El checkpoint incluye código, migración, pruebas y documentación;
excluye `.env.local`, secretos, `node_modules`, `.next` y datos del volumen Docker.
