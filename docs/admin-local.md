# Administración local de TRAMA

Este hito cambia todas las lecturas públicas a PostgreSQL. Los datos estáticos
quedan como origen del seed; no hay fallback silencioso al catálogo anterior.
Google está configurado en el entorno local del propietario, quien confirmó
manualmente el inicio de sesión y el recorrido administrativo. Las credenciales
permanecen en `.env.local` ignorado. No se ha desplegado esta implementación.

## Arranque

Con Node 22, npm y Docker Desktop Linux, desde la raíz:

```sh
npm ci
npm run db:setup
npm run db:up
npm run db:migrate
npm run db:seed:dry
npm run db:seed
npm run auth:setup
npm run dev
```

`db:setup` no sobrescribe `.env.local` existente. `auth:setup` añade únicamente
BETTER_AUTH_URL y un secreto aleatorio local si faltan; no los imprime.
Conservar ese secreto entre reinicios. Sin configuración completa, el botón de
Google está deshabilitado y todas las operaciones administrativas se deniegan.
El catálogo sí funciona si PostgreSQL está disponible y migrado.

## Google OAuth (configuración de un entorno local nuevo)

En un proyecto de desarrollo propio de Google Cloud, configurar la pantalla de
consentimiento y un cliente OAuth de tipo aplicación web. Si está en modo prueba,
añadir la cuenta administradora como usuario de prueba. No usar credenciales de
producción. Registrar exactamente:

- Origen JavaScript: `http://localhost:3000`
- URI de retorno: `http://localhost:3000/api/auth/callback/google`

Completar **solo en `.env.local` ignorado por Git**:

| Variable | Uso |
| --- | --- |
| `BETTER_AUTH_URL` | Origen local, por defecto `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Secreto aleatorio creado por `auth:setup` |
| `GOOGLE_CLIENT_ID` | ID del cliente OAuth de desarrollo |
| `GOOGLE_CLIENT_SECRET` | Secreto del mismo cliente |
| `TRAMA_ADMIN_EMAIL` | Una única cuenta de Google autorizada, no una lista CSV |

Reiniciar Next.js. Entrar usando **localhost**, no alternarlo con 127.0.0.1.
Si cambia el puerto, actualizar BETTER_AUTH_URL, origen y URI en Google.

Abrir `/admin/login`. El primer OAuth de esa cuenta con correo verificado crea
su usuario y acceso administrativo activo. Cualquier otro correo se rechaza.
No hay contraseña, formulario de registro público, vinculación automática de
cuentas ni endpoint de desarrollo para omitir el inicio de sesión.

La sesión dura ocho horas. Cada página protegida y operación consulta sesión,
cuenta Google, correo verificado, coincidencia con la configuración y permiso
activo en `admin_access`. La cookie de sesión no contiene el permiso como una
decisión cacheada. Better Auth gestiona OAuth, firma de cookies y protección CSRF;
Next.js conserva su comprobación de origen de Server Actions.

Revocar acceso a la cuenta **actualmente configurada**:

```sh
npm run admin:access -- revoke
```

Se desactiva el permiso y eliminan sus sesiones. Iniciar OAuth de nuevo no
reactiva permisos revocados. Para rehabilitar esa identidad ya verificada:

```sh
npm run admin:access -- grant
```

Estos comandos rechazan bases remotas. Para cambiar de administrador, revocar
primero la cuenta anterior, cambiar TRAMA_ADMIN_EMAIL y reiniciar. La nueva cuenta
se provisiona tras su primer OAuth verificado. Un cambio de allowlist también
deniega las sesiones de la cuenta anterior en cada operación.

## Productos

- `/admin`: buscar y filtrar borradores/publicados/archivados; crear, editar,
  publicar, despublicar o archivar.
- El formulario selecciona categorías existentes, colección, precio PEN,
  colores, variantes y fotos de la biblioteca versionada. Este hito no añade
  un CRUD de categorías ni subidas de archivos.
- Guardar borrador despublica; guardar y publicar valida descripción, precio
  positivo, foto y stock explícito de cada variante nueva. Cero significa agotado.
- NULL se conserva al publicar solo en variantes demo importadas que ya tenían
  stock desconocido; nunca se inventan existencias. Un borrador nuevo puede tener
  stock pendiente, pero no publicarse así.
- El primer archivo de la lista es portada. Las flechas cambian el orden y una
  imagen puede asociarse a un color. La vista previa muestra datos guardados y
  no permite añadirlos a la bolsa.
- Slugs existentes no se editan. SKU y combinaciones son únicos. Ediciones
  simultáneas se controlan mediante versión; si hay conflicto se debe recargar.
  Todo el agregado de producto se guarda en una transacción.
- Los campos de orden destacado son únicos: liberar una posición ocupada antes
  de asignarla a otra prenda. No hay reordenamiento masivo en esta entrega.

Inicio y producto consultan en servidor sin caché persistente. Catálogo, bolsa
y WebMCP comparten el mismo DTO publicado; el navegador refresca al navegar,
recuperar foco y cada 30 segundos. Una publicación se ve en la siguiente petición
sin build. Una pestaña abierta puede conservar hasta 30 segundos su vista anterior.
Si falla la red conserva la última vista recibida; la bolsa es una consulta, no
una reserva ni confirmación de inventario.

La bolsa migra `trama-selection-v1` (slug/talla) a IDs de variantes en
`trama-selection-v2` si la coincidencia es única. Retira líneas no publicadas o
agotadas y limita cantidades al stock explícito. El tope 99 con stock desconocido
es un límite de la consulta, nunca una afirmación de existencias. Los importes
se suman en céntimos y se convierten a PEN para mostrar y consultar.

## Verificación

```sh
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run build
```

Integración crea y elimina únicamente una base `trama_test_<uuid>` en el
PostgreSQL local dedicado. Incluye migraciones vacías/repetidas, seed, restricciones,
sesiones Better Auth firmadas mediante su biblioteca, permisos denegados,
revocación, creación, edición, publicación, validación y compatibilidad de bolsa.
Las identidades y existencias de esas pruebas son sintéticas y no se escriben
en `trama_local`. **No son una prueba del intercambio OAuth con Google.**

Después de configurar Google, comprobar manualmente: cuenta ajena rechazada,
cuenta permitida → formulario → borrador invisible → publicación visible en una
ventana privada → edición/despublicación → revocación → acceso denegado. Revisar
también el formulario en móvil. El propietario ya confirmó el OAuth permitido,
creación de borrador, publicación, edición, archivo y cierre de sesión locales.
No se ha registrado confirmación manual de cuenta ajena, revocación o móvil;
los escenarios automatizados de permisos no sustituyen esas pruebas visuales.

Referencias oficiales consultadas: [Next.js](https://www.better-auth.com/docs/integrations/next),
[Google](https://www.better-auth.com/docs/authentication/google),
[Drizzle](https://www.better-auth.com/docs/adapters/drizzle),
[hooks de base de datos](https://www.better-auth.com/docs/concepts/database).
