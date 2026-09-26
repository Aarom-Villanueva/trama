# TRAMA en Vercel

El proyecto actual es Next.js App Router. Usar Node.js 22, instalación `npm ci`,
build `npm run build` y el preset Next.js. No definir una carpeta de salida manual.

En esta etapa todas las rutas públicas conservan `data/products.ts`. No necesitan
PostgreSQL para compilar o funcionar, y no hay panel, login ni endpoints de carga.
Los módulos nuevos de base de datos están aislados y se ejecutan mediante comandos
locales explícitos. No añadir `db:migrate` ni `db:seed` al build de Vercel.

`compose.yaml` y `.env.local` pertenecen exclusivamente al desarrollo local.
No copiar sus credenciales a Vercel, no subir `.env.local` y no conectar una Preview
a una base de producción. `.env.example` documenta únicamente valores ficticios.

El futuro paso a persistencia pública necesitará provisión separada de PostgreSQL,
gestión de secretos, migraciones controladas y pruebas en Preview aislada. Esa
integración y cualquier despliegue quedan fuera de esta implementación.

Las imágenes existentes se publican como archivos versionados en `public/images`.
Las nuevas cargas administrables necesitarán almacenamiento persistente externo;
no se escribirán en el disco de una función de Vercel.
