# TRAMA

Demo de catálogo de ropa con Next.js App Router, React y TypeScript. Inicio,
catálogo con filtros, detalle y bolsa local con consulta por WhatsApp.
Las prendas no representan inventario comercial: disponibilidad por confirmar.

## Requisitos y ejecución

- Node.js 22 (mínimo 22.13.0) y npm 10.9.3, usados en la verificación.
- `package-lock.json` es la fuente de instalación reproducible.
- Docker Desktop con contenedores Linux y Docker Compose, solo para PostgreSQL.

```sh
npm ci
npm run db:setup
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Abrir http://localhost:3000. Todas las superficies públicas consultan PostgreSQL.
La ejecución requiere DATABASE_URL local y migraciones aplicadas; el build no
aplica migraciones ni carga datos. Para administrar, consultar [OAuth y panel](docs/admin-local.md).

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

`npm test` ejecuta pruebas sin PostgreSQL. Lint mantiene advertencias de imágenes
HTML; no se desactiva esa regla. Ver [línea base histórica](docs/backend-foundation.md)
y [verificación del panel](docs/admin-local.md).

## PostgreSQL local exclusivo para TRAMA

1. Iniciar Docker Desktop en modo Linux.
2. Ejecutar los siguientes comandos desde la raíz del proyecto:

```sh
npm run db:setup
npm run db:up
npm run db:status
npm run db:migrate
npm run db:seed:source
npm run db:seed:dry
npm run db:seed
npm run db:seed
npm run test:integration
```

- `db:setup` crea `.env.local` con una contraseña aleatoria local, sin mostrarla.
  Busca un puerto libre entre 55432 y 55532, empezando por 55432, y no sobrescribe
  un archivo existente. `.env.example` solo contiene valores ficticios.
- Compose crea el proyecto `trama-foundation`, la base y usuario `trama_local`
  y el volumen `trama-foundation_postgres-data`. Solo publica el puerto en
  `127.0.0.1`; no usa las instalaciones PostgreSQL existentes del equipo.
- La imagen PostgreSQL 17 está fijada por digest en `compose.yaml`.
- `db:migrate` aplica únicamente el SQL versionado de `drizzle/`.
  No ejecuta seed ni modifica automáticamente el esquema al iniciar Next.js.
- `db:seed:source` comprueba las imágenes y calcula el inventario de registros
  desde el código, sin conectarse a una base.
- `db:seed:dry` consulta la base **en una transacción de solo lectura** y muestra
  qué registros faltan. Requiere haber aplicado las migraciones. Es una previsión
  de inserciones, no una simulación de todas las posibles colisiones SQL.
- El segundo `db:seed` no debe insertar nada. No hay actualizaciones automáticas
  de productos, categorías ni hijos ya importados.
- `test:integration` crea una base vacía temporal `trama_test_<identificador>`
  dentro de este mismo contenedor, aplica migraciones y la elimina al terminar.
  No reinicia ni borra `trama_local`. Necesita el permiso local `CREATEDB`, incluido
  en el usuario de la imagen; este usuario no es un modelo para producción.

Los comandos con acceso a datos rechazan hosts remotos, nombres de otras bases,
otros usuarios, parámetros de conexión adicionales y puertos fuera del rango de
TRAMA. No suministrar credenciales cloud a estas herramientas.

Para detener la base conservando su volumen:

```sh
npm run db:down
```

Para reiniciarla, usar `npm run db:up`. No se incluye un comando de borrado del
volumen. Si el puerto elegido después queda ocupado, cambiar tanto `TRAMA_DB_PORT`
como el puerto de `DATABASE_URL` en `.env.local`, manteniéndolos en el rango
55432–55532. Las variables de la terminal prevalecen sobre `.env.local`; no mantener
un `DATABASE_URL` de otro proyecto en esa terminal. No imprimir el archivo ni
ejecutar `docker compose config` sin opciones: puede mostrar la contraseña.

La contraseña se aplica al inicializar el volumen. Cambiarla en `.env.local`
después no cambia la contraseña de PostgreSQL; conservar este archivo junto con
el volumen y gestionar cualquier rotación por separado.

## Evolución del esquema

```sh
npm run db:generate -- --name=descripcion_del_cambio
# Revisar manualmente el SQL nuevo y sus restricciones antes de continuar.
npm run db:migrate
npm run test:integration
```

No editar migraciones ya aplicadas, no utilizar `drizzle-kit push` y no ejecutar
migraciones como parte de `next build`. Las herramientas CLI usan la condición
`react-server` únicamente para acceder a módulos marcados `server-only`; no se
debe establecer esa condición globalmente para Next.js.

## Alcance actual

- Implementado: PostgreSQL, seed repetible, Better Auth + Google, permiso adicional
  de administrador, panel de productos y lectura pública coordinada.
- Las 12 prendas actuales producen 7 categorías, 12 colores, 57 variantes,
  24 imágenes y 4 destacados. Estos números se calculan y verifican contra el
  código; no son constantes impuestas al seed.
- Todo el stock importado es `NULL`: significa **por confirmar**, nunca ilimitado.
- Fotos actuales en `public/images`; frente/espalda y URLs conservadas.
- Catálogo, inicio, detalle, bolsa y WebMCP usan productos publicados de PostgreSQL.
- OAuth real y el recorrido administrativo local fueron verificados manualmente
  por el propietario; ver [registro y límites](docs/verification-admin.md).
- No hay uploads, pedidos, checkout ni pagos. PostgreSQL sigue siendo local;
  Google OAuth usa credenciales de desarrollo en `.env.local` ignorado.

Ver [arquitectura](ARCHITECTURE.md), [despliegue actual](README-VERCEL.md) y
[evidencias de implementación](docs/backend-foundation.md).
