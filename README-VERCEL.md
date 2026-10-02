# TRAMA en Vercel

El proyecto actual es Next.js App Router. Usar Node.js 22, instalación `npm ci`,
build `npm run build` y el preset Next.js. No definir una carpeta de salida manual.

Esta rama local usa PostgreSQL en todas las rutas públicas y tiene panel y login.
No se ha desplegado este hito. La demo publicada no cambia por editar localmente.
`vercel.json` deshabilita los despliegues automáticos de Git únicamente para
`feature/trama-backend-foundation`, para poder subir el checkpoint sin generar
una Preview. Antes de autorizar un despliegue futuro de esta rama, revisar esa
regla y preparar su entorno aislado. No modifica la configuración de `main`.
Referencia: [git.deploymentEnabled](https://vercel.com/docs/project-configuration/git-configuration).
El build no consulta PostgreSQL, pero la ejecución necesita una base configurada
y migrada. No añadir `db:migrate` ni `db:seed` al build de Vercel.

`compose.yaml` y `.env.local` pertenecen exclusivamente al desarrollo local.
No copiar sus credenciales a Vercel, no subir `.env.local` y no conectar una Preview
a una base de producción. `.env.example` documenta únicamente valores ficticios.

El futuro paso a persistencia pública necesitará provisión separada de PostgreSQL,
gestión de secretos, migraciones controladas y pruebas en Preview aislada. Esa
integración y cualquier despliegue quedan fuera de esta implementación.

Las imágenes existentes se publican como archivos versionados en `public/images`.
Las nuevas cargas administrables necesitarán almacenamiento persistente externo;
no se escribirán en el disco de una función de Vercel.
