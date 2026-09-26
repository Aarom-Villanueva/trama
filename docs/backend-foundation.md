# Base PostgreSQL local: alcance y verificación

Implementación en `feature/trama-backend-foundation`, partiendo de `b3c86859d9`.
El árbol inicial estaba limpio. La implementación inicial se realizó sin commit,
push ni despliegue. El cierre de esta etapa incluye commit y push de la rama por
petición del usuario; no incluye merge a main ni promoción a producción.

## Problemas preexistentes

1. `npm ci` rechazaba el lockfile: ubicación incompatible de AJV y dependencias
   transitivas ausentes. Después de la primera reparación aparecieron tres
   entradas sin versión (`@types/d3-color`, `@types/d3-path`, `jiti`). Se completó
   la resolución y se verificó una instalación limpia con `npm ci`.
2. El archivo de `is-extglob` faltante quedó recuperado por la instalación limpia.
3. El lint inicial ejecutable encontró dos errores `set-state-in-effect`: carga
   inicial de localStorage y sincronización del buscador con navegación URL.
   Inicialmente se añadieron dos excepciones de ESLint limitadas a cada línea.
   En la revisión de cierre se retiró la del buscador: ahora ajusta el borrador
   mediante una comparación con la consulta anterior durante render, antes de
   mostrar texto desactualizado en el DOM. Solo se conserva la excepción de la
   bolsa para hidratar localStorage después de SSR; no se desactiva globalmente.
4. Permanecen siete advertencias anteriores: seis usos de `<img>` y la expresión
   condicional del filtro de categoría. No impiden lint/build y no son fallos
   introducidos por PostgreSQL.
5. README y arquitectura describían Vinext/Cloudflare y pnpm; ahora documentan
   Next.js, npm y el alcance local real.

Antes de añadir el backend, TypeScript y build ya pasaban. El lint tenía los dos
errores anteriores. No se atribuyen estas incidencias al nuevo esquema.

## Dependencias y compatibilidad

Se conservaron las versiones resueltas de todas las dependencias directas
preexistentes, incluidos Next 16.3.4 y React 19.2.6. Se agregaron versiones exactas:

| Paquete | Versión | Uso |
| --- | --- | --- |
| drizzle-orm | 0.45.3 | Esquema y consultas PostgreSQL |
| drizzle-kit | 0.31.11 | Generación de SQL y snapshots |
| pg | 8.23.0 | Driver Node.js PostgreSQL |
| @types/pg | 8.23.1 | Tipado del driver |
| server-only | 0.0.1 | Límite de importación cliente/servidor |
| tsx | 4.23.15 | Scripts TypeScript y pruebas con Node |

Drizzle acepta `pg >=8`; pg exige Node >=16 y tsx >=18. La verificación utilizó
Node 22.20.0 y npm 10.9.3. Además de los rangos publicados, se ejecutaron
generación, migraciones, consultas y pruebas con esta combinación instalada.

El diff de lockfile incluye resolución/reordenación de metadatos y dependencias
transitivas; no una actualización general de paquetes. AJV 6 se conserva donde
lo requiere ESLint y AJV 8 ocupa la ubicación correspondiente a otros peers.
La instalación ya no emite avisos de lockfile dañado. npm sí informa deprecation
de ESLint 9 y dos dependencias transitivas de Drizzle Kit; no se hizo una migración
de herramientas ajena al alcance para ocultar esos avisos.

Referencias oficiales consultadas:
- [Drizzle con PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [Claves y restricciones](https://orm.drizzle.team/docs/indexes-constraints)
- [Migraciones versionadas](https://orm.drizzle.team/docs/drizzle-kit-migrate)

## PostgreSQL y revisión del SQL

Se detectaron instalaciones PostgreSQL de otros proyectos y se dejaron intactas.
Docker Desktop estaba instalado y su motor se inició. Se creó exclusivamente el
proyecto Compose `trama-foundation`, puerto 55432 de loopback y volumen propio.
PostgreSQL efectivo: 17.11, imagen oficial de la rama 17 fijada por digest.

La migración `drizzle/0000_wandering_excalibur.sql` se generó con Drizzle Kit y se
leyó antes de aplicarla. Se comprobaron las cinco tablas, enums, FK compuestas,
unicidades, restricciones de céntimos/stock/orden y ausencia de borrados o tablas
fuera del alcance. La aplicación se limitó a `trama_local` y a bases temporales
creadas por las pruebas dentro del mismo servicio.

## Comprobaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| `npm ci --no-audit --no-fund` con lockfile final | Correcto |
| `npm ls --depth=0` | Dependencias directas instaladas y coherentes |
| `npm run typecheck` | Correcto |
| `npm run lint` | 0 errores; 7 advertencias preexistentes |
| `npm test` | 5 pruebas correctas, sin PostgreSQL |
| `npm run db:generate` | SQL y metadatos generados |
| `npm run db:migrate` | Aplicado al PostgreSQL exclusivo de TRAMA |
| `npm run db:seed:source` | Conteos e imágenes verificados contra el código |
| `npm run db:seed:dry` antes de cargar | Solo lectura; prevé la importación completa |
| `npm run db:seed`, dos veces | Primera carga completa; segunda con cero inserciones |
| `npm run db:seed:dry` después de cargar | Cero registros pendientes |
| `npm run test:integration` | 7 escenarios PostgreSQL correctos, más el test contenedor |
| `npm run build` con el contenedor TRAMA detenido | Correcto; mismas rutas estáticas y 12 detalles |
| Consulta final de inventario | 57 variantes, las 57 con stock NULL |

Las pruebas de integración crean una base nueva por ejecución y verifican:

- Migraciones sobre una base vacía y repetición sin reaplicación.
- Simulación sin cambios en ninguna de las cinco tablas.
- Seed doble sin diferencias, comparando también IDs y timestamps.
- Preservación de slugs, precios, tallas, imágenes, posiciones y destacados.
- Rechazo de SKU, combinación, slug y orden de imagen duplicados; stock/precio
  negativos; colores de otro producto tanto en variantes como en imágenes.
- Repositorio que filtra borradores/archivados y representa el stock desconocido.
- Conservación de ediciones de categoría, producto, color, variante y foto,
  incluyendo cambios de slug/SKU y eliminación de una imagen.
- Rollback completo ante una colisión de otra identidad de importación.

Las cantidades sintéticas de una prueba solo existieron en su base temporal,
que se eliminó al finalizar. No quedaron bases `trama_test_*`. Después del build
se volvió a iniciar el contenedor persistente de TRAMA.

Se comprobó que los módulos públicos no importan el repositorio ni Drizzle. La
única extracción de presentación fue compartir los mismos cuatro slugs destacados
entre el inicio y el seed. No se realizó una prueba visual/interactiva de navegador.

## Revisión de cierre

- La excepción `react-hooks/set-state-in-effect` de `features/bag/bag-provider.tsx`
  se mantiene exclusivamente para la hidratación inicial de localStorage. Su coste
  es una actualización inicial controlada; la revisión no identificó bucles ni
  sobrescritura antes de cargar, gracias a `ready`.
- La excepción de `features/catalog/catalog.tsx` se eliminó corrigiendo la causa:
  el texto de búsqueda se ajusta al cambiar `q` antes del commit al DOM. El guard
  converge tras un render y no borra el borrador al cambiar otros filtros.
- Se revisaron los archivos preparados para Git: no incluyen `.env.local`,
  dependencias instaladas, compilaciones ni datos del volumen Docker. La búsqueda
  en el índice no encontró las credenciales locales ni patrones de secretos;
  `.env.example` contiene solo los valores ficticios documentados.
- Se repitieron typecheck, lint, build, cinco pruebas sin base y siete escenarios
  de integración. Estos últimos fallaron inicialmente con `ECONNREFUSED` porque
  Docker estaba detenido; tras iniciarlo y levantar solo el servicio de TRAMA,
  pasaron. El build también pasó mientras la base estaba detenida.

## Pendiente

No faltan requisitos para ejecutar las pruebas locales en este equipo. En otro
equipo se necesita Node/npm y Docker Desktop iniciado; el README contiene todos
los comandos. `.env.local` no está versionado y debe generarse allí.

La siguiente entrega debe implementar autenticación de administrador y comprobar
autorización en cada operación del servidor, antes del panel. Requiere definir la
cuenta administrativa y configurar el proveedor elegido en un entorno de pruebas.
Posteriormente se conectarán coordinadamente todas las superficies públicas.
No hay autenticación, panel, uploads, pagos ni conexión a producción en esta base.
