# CampusCode

Plataforma académica full-stack para organizar materias, practicar con un banco de ejercicios, registrar préstamos de computadores y conectar con retos, vacantes y pruebas técnicas de empresas.

> **Proyecto académico de demostración.** Las empresas, retos, cuentas, equipos, préstamos, vacantes, pruebas y métricas iniciales son ficticios y están identificados como tales en la interfaz. No representan alianzas, estudiantes, procesos de selección ni resultados reales.
>
> **CampusCode no ofrece tutorías.** No hay tutores, reservas de sesiones, calendarios de disponibilidad ni pagos por tutoría. El acompañamiento se limita al contenido de práctica, la guía local del asistente y los retos empresariales.

---

## 1. Qué incluye

- **Banco de ejercicios:** 43 ejercicios originales de demostración, organizados en 7 carreras, 20 materias y 40 temas. Incluye filtros por carrera, materia, tema, dificultad, tipo de respuesta y estado; favoritos; pistas; procedimiento; explicación y cálculo de progreso.
- **Asistente académico:** integración real con proveedores compatibles con la API de OpenAI, ejecutada **solo en el servidor**. Si no hay credenciales, responde una **guía local determinista** claramente etiquetada, que no se presenta como IA.
- **Progreso académico:** ejercicios completados, intentos, materias practicadas, serie de actividad de 14 días, objetivos personales y actividad reciente calculados con datos de la base local.
- **Materias personales:** cada estudiante empieza con un tablero vacío y agrega materias del catálogo por carrera con el botón flotante `+` y un modal de registro. El catálogo público vive en `/catalogo`; el tablero privado en `/materias`.
- **Préstamo de computadores:** inventario por sala, disponibilidad, formulario con sala, número de equipo, hora de entrada/salida y estado del PC, además de préstamos activos, historial y cierre de salida.
- **Retos empresariales:** catálogo público, detalle del reto, postulación, entregables por enlace, retiro de postulación y panel de empresa para publicar, editar, cerrar y moderar postulaciones.
- **Portal de reclutamiento:** vacantes de empleo, práctica y junior publicadas por empresas, detalle público y pruebas técnicas de admisión con preguntas abiertas o de opción múltiple. Las respuestas correctas nunca se envían al portal público.
- **Tres roles con autorización de servidor:** estudiante, empresa y administración. Ocultar un botón no es la protección: cada endpoint valida sesión, rol y propiedad del recurso.
- **Panel administrativo:** usuarios y roles, activación/desactivación, catálogo de carreras y materias, publicación de ejercicios, moderación de retos y reportes.
- **Estados de interfaz:** carga, error, vacío, confirmaciones, notificaciones y mensajes de validación.
- **Diseño responsive:** verificado a 390 px (móvil), 820 px (tablet) y 1440 px (escritorio), incluidas las nuevas vistas de materias, PCs, vacantes y pruebas.

### Lo que no incluye

- Tutorías, tutores, agendamiento, disponibilidad o pagos de sesiones.
- Postulación, seguimiento de candidaturas o calificación automática de pruebas técnicas: el portal publica vacantes y evaluaciones, no es un ATS.
- Pagos, suscripciones o pasarela de cobro.
- Carga de archivos: los entregables son enlaces (`http`/`https`) con notas.
- Envío de correos transaccionales (las notificaciones viven dentro de la aplicación).
- Métricas reales de uso o de estudiantes: todos los conteos iniciales son de demostración.

---

## 2. Stack técnico

| Capa | Tecnología |
| --- | --- |
| Interfaz | React 19, TypeScript 5.9, Vite 8, React Router 7 |
| Estilos | Tailwind CSS 4, componentes propios, Phosphor Icons, KaTeX |
| Servidor | Node.js 24+, Express 5 |
| Base de datos | SQLite mediante `node:sqlite` (sin ORM), con esquema PostgreSQL de referencia |
| Autenticación | bcrypt + JWT en cookie `httpOnly`, `SameSite=Lax` |
| Pruebas | `node:test` + `fetch` contra una instancia real de Express y una base temporal |

No hay dependencias de servicios externos para arrancar. La única integración opcional es la API de IA.

---

## 3. Requisitos

- **Node.js 24 o superior** (probado con Node 26.8.1). Se usa `node:sqlite` y `process.loadEnvFile`, disponibles de forma estable en Node 24+.
- npm 11 o superior.
- Puerto libre `4000` para la API y `5173` para Vite en desarrollo.

---

## 4. Instalación y ejecución

### 4.1 Desarrollo

```bash
npm install
cp .env.example .env
```

En PowerShell:

```powershell
npm install
Copy-Item .env.example .env
```

> Si `.env` ya existe en tu copia de trabajo, **no lo sobrescribas**: puede contener tu clave de IA y tu `JWT_SECRET`. En esta entrega se dejó un `.env` local con un secreto generado y `AI_API_KEY` vacía.

Edita `.env` y define al menos un `JWT_SECRET` largo y aleatorio. Puedes generarlo con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Para activar la IA, pega tu clave en `AI_API_KEY` y elige el proveedor en `AI_PROVIDER` (`openai` para OpenAI, DeepSeek u OpenRouter; `anthropic` para la API nativa). Los ejemplos exactos están en [`docs/PRODUCCION.md`](docs/PRODUCCION.md). Sin clave, la app usa la guía local y lo indica.

Luego:

```bash
npm run seed:reset
npm run dev
```

`npm run dev` inicia:

- API: <http://localhost:4000>
- Interfaz: <http://localhost:5173>

La primera vez, el servidor crea `data/campuscode.db`, aplica `db/schema.sql` y carga la semilla si la base está vacía. `seed:reset` es útil para volver al estado de demostración.

### 4.2 Producción (servidor único)

Copia `.env.production.example` como `.env.production`, completa el secreto y el dominio, y ejecuta:

```bash
npm ci
npm run build
npm run start:production
```

Con `NODE_ENV=production`, el servidor exige `JWT_SECRET`, activa `Secure` en la cookie, HSTS y una Content-Security-Policy estricta, y sirve `dist/` desde Express. `APP_ORIGIN` debe incluir el dominio público exacto.

```dotenv
# NODE_ENV se fija con scripts/start-production.mjs
JWT_SECRET=<secreto-de-produccion>
APP_ORIGIN=https://campuscode.com,https://www.campuscode.com
PORT=4000
DB_PATH=./data/campuscode.db
```

No publiques `.env`, `.env.production` ni la base `data/`.

> **Importante:** no definas `NODE_ENV=development` dentro de `.env`. Vite puede incluirlo en el build y arrastrar React de desarrollo (el bundle pasa de ~1,27 MB a ~1,60 MB). En local deja la variable sin definir; en producción expórtala como `NODE_ENV=production` en el entorno del proceso.

### 4.3 Dominio `campuscode.com` con Cloudflare Tunnel

La configuración para publicar con HTTPS sin VPS está en [`docs/DOMINIO.md`](docs/DOMINIO.md). El dominio está registrado en Hover y debe mover sus nameservers a Cloudflare antes de crear el túnel. El binario `tools/cloudflared.exe` ya está descargado.

Antes de abrir el sitio al público, cambia la contraseña de administración demo:

```bash
node --env-file=.env.production scripts/set-password.mjs admin@campuscode.co "UnaClaveLargaYPropia"
```

---

## 5. Cuentas de demostración

Contraseña para las tres cuentas: **`Campus123!`**

| Rol | Correo | Acceso principal |
| --- | --- | --- |
| Estudiante | `estudiante@campuscode.co` | `/dashboard`, mis materias, préstamo de PCs, progreso, favoritos, postulaciones |
| Empresa | `empresa@campuscode.co` | `/empresa`, retos propios, vacantes, pruebas técnicas, postulaciones, perfil |
| Administración | `admin@campuscode.co` | `/admin`, usuarios, catálogo, moderación |

Otras cuentas de empresa de demostración: `aurora@campuscode.co`, `legal@campuscode.co`, `pacifico@campuscode.co`, `eco@campuscode.co` (misma contraseña).

---

## 6. Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | API con recarga y Vite en paralelo |
| `npm run dev:server` | Solo API en `4000` |
| `npm run dev:client` | Solo Vite en `5173` |
| `npm run seed` | Carga la semilla solo si la base está vacía |
| `npm run seed:reset` | Reinicia la base al estado de demostración |
| `npm run typecheck` | Verificación estricta de TypeScript |
| `npm run lint` | ESLint (0 errores; advertencias documentadas) |
| `npm run build` | Typecheck + build de producción en `dist/` |
| `npm start` | Sirve API y, si existe, `dist/` |
| `npm run start:production` | Arranca con `.env.production` y sirve `dist/` |
| `npm run set-password` | Cambia la contraseña de una cuenta desde la terminal |
| `npm test` | Suite de integración de la API y de los protocolos de IA, con base temporal aislada |

---

## 7. Rutas de la aplicación

### Públicas

| Ruta | Página |
| --- | --- |
| `/` | Landing completa: hero, accesos rápidos, campus en vivo, beneficios, carreras, ejercicios, IA, progreso, retos, cómo funciona, empresas, FAQ y CTA |
| `/catalogo` | Catálogo académico público |
| `/catalogo/:id` | Detalle público de materia y temas |
| `/carreras/:slug` | Detalle de carrera (ruta adicional) |
| `/ejercicios` | Banco de ejercicios con filtros |
| `/ejercicios/:id` | Ejercicio, respuesta, pista y procedimiento |
| `/asistente` | Asistente académico (modo visitante o con historial) |
| `/retos` | Catálogo de retos |
| `/retos/:slug` | Detalle del reto y postulación (acepta el slug o el ID del reto) |
| `/empresas` | Propuesta para empresas, vacantes y pruebas técnicas públicas |
| `/sobre-nosotros` | Alcance, IA, privacidad y proyecto |
| `/login` | Inicio de sesión |
| `/registro` | Registro de estudiante o empresa |

### Estudiante (`student`)

`/dashboard`, `/materias`, `/prestamo-pcs`, `/mi-progreso`, `/favoritos`, `/mis-retos`, `/perfil`, `/configuracion`

### Empresa (`company`)

`/empresa`, `/empresa/retos`, `/empresa/retos/nuevo`, `/empresa/retos/:id` (edición), `/empresa/postulaciones`, `/empresa/vacantes`, `/empresa/vacantes/nuevo`, `/empresa/vacantes/:id` (edición), `/empresa/pruebas`, `/empresa/pruebas/nuevo`, `/empresa/pruebas/:id` (edición), `/empresa/perfil`

### Administración (`admin`)

`/admin`, `/admin/usuarios`, `/admin/materias`, `/admin/ejercicios`, `/admin/retos`, `/admin/reportes`

Las rutas privadas redirigen al inicio de sesión si no hay sesión y al panel del rol correcto si el rol no coincide. La autorización real se repite en el servidor. `/materias/:id` se conserva como alias histórico del detalle público, pero los enlaces actuales usan `/catalogo/:id`.

---

## 8. Estructura del proyecto

```text
.
├── db/
│   ├── schema.sql              # Esquema SQLite usado en ejecución
│   └── schema.postgres.sql     # Referencia equivalente para PostgreSQL (no conectada)
├── docs/
│   ├── IA.md                   # Configuración y comportamiento del asistente
│   ├── BASE-DE-DATOS.md        # SQLite, PostgreSQL y migración a Supabase
│   ├── DOMINIO.md              # Publicación de campuscode.com con Cloudflare Tunnel
│   ├── PRODUCCION.md           # IA live, Supabase Auth, rate limit y despliegue
│   ├── PRUEBAS.md              # Evidencia de pruebas y verificaciones
│   ├── ESTADO.md               # Funciones implementadas y pendientes
│   └── evidence/               # Capturas de la verificación visual
├── scripts/
│   └── dev.mjs                 # Arranque conjunto de API y Vite
├── server/
│   ├── ai.js                   # Integración OpenAI-compatible + guía local
│   ├── app.js                  # Express, cabeceras, origen, estáticos
│   ├── auth.js                 # JWT, cookie, roles, rate limit
│   ├── db.js                   # SQLite, PRAGMA, esquema y semilla
│   ├── index.js                # Arranque y cierre ordenado
│   ├── seed-data.js            # Semilla determinista de demostración
│   ├── seed.js                 # Script de semilla / reset
│   ├── validate.js             # Validación y errores HTTP
│   ├── utils.js                # IDs, actividad, fechas
│   └── routes/                 # auth, catalog, campus, recruitment, challenges, company, admin, ai
├── src/
│   ├── components/             # UI, layout, auth, home, retos, comunes
│   ├── hooks/                  # useAsyncData y utilidades
│   ├── lib/                    # api, auth, tipos, formato, toasts
│   └── pages/                  # páginas públicas, estudiante, empresa y admin
├── tests/
│   ├── api.test.mjs            # Suite de integración de la API
│   └── ai-providers.test.mjs   # Protocolos OpenAI-compatible y Anthropic con proveedor simulado
├── .env.example
├── package.json
└── vite.config.ts
```

> `legacy/` conserva un prototipo anterior del proyecto y **no forma parte de la aplicación actual**: no se compila, no se sirve, no se prueba y no contiene funciones de tutoría. Se mantiene solo como referencia histórica.

---

## 9. Base de datos

### Ejecución real: SQLite

- Archivo: `data/campuscode.db` (configurable con `DB_PATH`).
- Se activan claves foráneas, WAL y `busy_timeout`.
- `db/schema.sql` se aplica de forma idempotente al arrancar.
- No hay ORM: todas las consultas usan sentencias preparadas con parámetros.

Tablas principales:

`users`, `profiles`, `careers`, `subjects`, `topics`, `exercises`, `favorites`, `progress`, `activity_log`, `study_goals`, `user_subjects`, `computers`, `computer_loans`, `companies`, `challenges`, `vacancies`, `technical_tests`, `applications`, `deliverables`, `conversations`, `messages`, `notifications`, `reports`.

### Referencia PostgreSQL

`db/schema.postgres.sql` reproduce tablas, índices, restricciones y notas de RLS para un despliegue PostgreSQL. **No está conectado al servidor actual**: es una referencia de migración, no una base operativa. Para usar PostgreSQL hay que implementar el adaptador de consultas correspondiente y ejecutar las migraciones en un servidor PostgreSQL real. Los pasos y variables están en [`docs/BASE-DE-DATOS.md`](docs/BASE-DE-DATOS.md).

### Datos de demostración

- 7 carreras, 20 materias, 40 temas, 43 ejercicios, 7 retos, 5 empresas ficticias y 7 usuarios.
- 12 computadores de demostración en tres salas, 4 préstamos de ejemplo, 7 vacantes y 6 pruebas técnicas (5 publicadas).
- Los retos, empresas, equipos, préstamos, vacantes y pruebas llevan `is_demo = 1` y se muestran con etiquetas «Demo» o avisos de demostración.
- El progreso, los favoritos, las postulaciones, las notificaciones, los préstamos y la conversación inicial son ejemplos cargados para la cuenta de estudiante.
- Las métricas del campus en la portada son ficticias y están etiquetadas como tales; no son estadísticas oficiales de la universidad.
- No se usan estadísticas de uso reales.

---

## 10. API

La API vive bajo `/api`. Todas las respuestas son JSON y las rutas privadas exigen la cookie de sesión.

| Grupo | Endpoints principales |
| --- | --- |
| Salud | `GET /api/health` |
| Autenticación | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Perfil y cuenta | `PATCH /api/auth/me/profile`, `PATCH /api/auth/me/password`, `DELETE /api/auth/me` |
| Notificaciones | `GET /api/auth/me/notifications`, `PATCH /api/auth/me/notifications/:id/read`, `POST /api/auth/me/notifications/read-all` |
| Catálogo | `GET /api/public-summary`, `/api/careers`, `/api/careers/:slug`, `/api/subjects`, `/api/subjects/:id` |
| Ejercicios | `GET /api/exercises`, `GET /api/exercises/:id`, `POST /api/exercises/:id/check`, `POST /api/exercises/:id/favorite`, `POST /api/exercises/:id/complete` |
| Estudiante | `GET /api/me/dashboard`, `/api/me/progress`, `/api/me/activity`, `/api/me/favorites`; CRUD de objetivos en `/api/me/goals` |
| Campus personal | `GET/POST/DELETE /api/my-subjects`; `GET /api/computers`; `GET/POST /api/computer-loans`; `PATCH /api/computer-loans/:id/return` |
| Retos | `GET /api/challenges`, `/api/challenges/:slug`, `GET /api/companies` |
| Reclutamiento público | `GET /api/vacancies`, `/api/vacancies/:slug`, `/api/technical-tests`, `/api/technical-tests/:id` |
| Postulaciones | `POST /api/challenges/:id/applications`, `GET /api/me/applications`, `POST /api/applications/:id/deliverables`, `POST /api/applications/:id/withdraw` |
| Empresa | `GET /api/company/overview`, `GET/PATCH /api/company/profile`, CRUD de `/api/company/challenges`, `/api/company/vacancies`, `/api/company/technical-tests`, `GET/PATCH /api/company/applications` |
| Administración | `GET /api/admin/overview`, `/users`, `/catalog`, `/exercises`, `/challenges`, `/reports`; `PATCH` para cada acción sensible |
| IA | `GET /api/ai/status`, `POST /api/ai/guest`, CRUD de `/api/conversations` y `POST /api/conversations/:id/messages` |
| Reportes | `POST /api/reports` |

Los detalles de validación, códigos de error y cuerpos se pueden leer directamente en `server/routes/`.

---

## 11. Seguridad

- Contraseñas con **bcrypt** (12 rondas) y comparación constante.
- Sesión JWT firmada, almacenada en cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción y expiración de 7 días.
- El frontend nunca recibe ni almacena el token ni claves de IA.
- `requireAuth` y `requireRole` se aplican en el servidor; la propiedad de empresa y de postulación se valida en cada operación.
- ID de sesión y rol se vuelven a leer de la base; desactivar una cuenta invalida su acceso.
- Consultas SQL parametrizadas; sin interpolación de entrada en SQL.
- Validación centralizada de cadenas, correos, fechas, enteros y enums.
- Límite de intentos de login (20/15 min), registro (12/15 min) y mensajes de IA (12/h visitante, 40/h autenticado). Es un limitador en memoria, adecuado para una sola instancia.
- Guardia de origen para métodos mutantes, además de `SameSite=Lax`.
- Cabeceras `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP; HSTS y CSP en producción.
- Errores internos no exponen stack traces al cliente.
- El cuerpo JSON está limitado a 120 KB.

**Limitación:** el rate limit en memoria no se comparte entre instancias; para escalar horizontalmente hace falta un almacén compartido (por ejemplo, Redis).

---

## 12. Asistente de IA

La guía completa está en [`docs/IA.md`](docs/IA.md). Resumen:

- Variables: `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_TIMEOUT_MS`, `AI_MODE`.
- `AI_PROVIDER=openai` funciona con OpenAI, DeepSeek, OpenRouter y cualquier API compatible. `AI_PROVIDER=anthropic` usa la API nativa de Anthropic.
- Si `AI_API_KEY` está vacío o `AI_MODE=local`, el asistente responde con la **guía local** y la interfaz lo indica en cada respuesta.
- Si hay clave y `AI_MODE` no es `local`, el servidor llama al proveedor configurado.
- La clave nunca llega al navegador.
- **El modo live se verificó con un proveedor simulado local, no con una cuenta real.** Configura tu clave para probarlo de extremo a extremo. Instrucciones en [`docs/PRODUCCION.md`](docs/PRODUCCION.md).

---

## 13. Pruebas y verificación

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Resultados registrados en [`docs/PRUEBAS.md`](docs/PRUEBAS.md):

- TypeScript: sin errores.
- ESLint: 0 errores (advertencias de Fast Refresh y dependencias de `useMemo`).
- API: **14/14 pruebas aprobadas** (12 de API y 2 del camino live con proveedor simulado), incluyendo autorización por rol, inyección SQL, cookie, duplicados, propiedad de empresa, moderación, materias personales, préstamos de PCs, vacantes, pruebas técnicas, guía local, guardia de origen y protocolos OpenAI/Anthropic.
- Build de producción: correcto (advertencia de tamaño del bundle, documentada).
- Navegador: rutas públicas, estudiante, empresa y administración verificadas; sin errores de consola.
- Responsive: sin scroll horizontal de página a 390, 820 y 1440 px en rutas públicas y nuevas vistas protegidas. Las tablas administrativas anchas usan contenedores con scroll interno.

---

## 14. Accesibilidad y UX

- Enlace «Saltar al contenido principal» en layout público y paneles.
- Navegación por teclado con estados `focus-visible` consistentes.
- Etiquetas asociadas en formularios, `aria-label` en acciones con icono, mensajes `role="status"` y regiones con `aria-labelledby`.
- Estados de carga, error y vacío en las vistas que consultan datos.
- Confirmaciones antes de eliminar objetivos, conversaciones, retos, cuentas o postulaciones.
- Respeto de `prefers-reduced-motion` en las animaciones de entrada.
- Contraste alto sobre fondos claros y oscuros; textos auxiliares con tamaños legibles.

---

## 15. Configuración pendiente para producción

1. **Credenciales de IA:** definir `AI_API_KEY` y verificar el proveedor live con una prueba real.
2. **JWT_SECRET de producción:** obligatorio; el servidor no arranca sin él con `NODE_ENV=production`.
3. **Dominio y HTTPS:** configurar `APP_ORIGIN`, certificado y proxy inverso.
4. **PostgreSQL:** implementar el adaptador y migrar con `db/schema.postgres.sql` si se requiere alta disponibilidad.
5. **Rate limit distribuido:** sustituir el almacén en memoria si se despliega en varias instancias.
6. **Correo transaccional:** no implementado; las notificaciones son internas.
7. **Almacenamiento de archivos:** no implementado; los entregables son enlaces.
8. **Analítica real:** no incluida; no debe confundirse la base de demostración con métricas de uso.
9. **Revisión legal:** privacidad, términos y tratamiento de datos deben validarse antes de uso institucional.

La lista detallada de lo implementado y lo pendiente está en [`docs/ESTADO.md`](docs/ESTADO.md). Las instrucciones de activación de IA, Supabase Auth y la migración de base de datos están en [`docs/PRODUCCION.md`](docs/PRODUCCION.md) y [`docs/BASE-DE-DATOS.md`](docs/BASE-DE-DATOS.md).

---

## 16. Licencia y contexto

Proyecto académico de emprendimiento de la Universidad Mayor de Cartagena. El contenido, las empresas y las cuentas son ejemplos creados para la demostración. No es una plataforma oficial de la institución ni una oferta comercial.
