# Base de datos: SQLite, PostgreSQL y Supabase

**Estado actual:** el servidor usa **SQLite** (`node:sqlite`) y no lee `DATABASE_URL`, `SUPABASE_URL` ni claves de Supabase. El archivo `db/schema.postgres.sql` es una **referencia de migración**, no una conexión activa.

Este documento explica qué variables harían falta, qué impide activarlas solo con `.env` y qué trabajo técnico exige una migración real.

---

## 1. Por qué no basta con pegar una URL

El acceso a datos actual es síncrono y específico de SQLite:

```js
db.prepare('SELECT * FROM users WHERE id = ?').get(id)
db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(id)
```

Eso aparece en todos los módulos de `server/routes/`. PostgreSQL necesita:

1. Un cliente asíncrono (`pg` o `postgres`).
2. Convertir `?` a `$1`, `$2`… o reescribir cada consulta.
3. Sustituir funciones de SQLite: `datetime('now')`, `date('now','localtime')`, `INSERT OR IGNORE`, `COLLATE NOCASE`, etc.
4. Adaptar transacciones y el *seeding*.
5. Volver asíncronas las rutas y los helpers que hoy devuelven valores de forma síncrona.
6. Ejecutar la suite contra PostgreSQL, no solo contra SQLite.

Definir `DATABASE_URL` sin ese adaptador **no cambia nada**: el proceso seguiría abriendo `data/campuscode.db`.

---

## 2. Variables que se usarían

### 2.1 PostgreSQL directo

| Variable | Uso | Dónde se obtiene |
| --- | --- | --- |
| `DATABASE_URL` | Cadena de conexión del servidor | Supabase → Project Settings → Database → Connection string, o tu servidor PostgreSQL |
| `PGSSLMODE` | `require` en proveedores gestionados | Configuración del proveedor |

Ejemplo de forma (sustituye los valores reales):

```dotenv
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres
PGSSLMODE=require
```

Para un servidor Node de larga duración conviene la conexión directa o el *pooler* en modo sesión. El *pooler* en modo transacción (puerto 6543) no admite todas las funciones de sesión; verifica la documentación de Supabase antes de elegir.

### 2.2 Supabase por API REST

| Variable | Uso | Exposición |
| --- | --- | --- |
| `SUPABASE_URL` | URL del proyecto, `https://<ref>.supabase.co` | Puede ir en el frontend |
| `SUPABASE_ANON_KEY` | Clave pública para Auth/REST con RLS | Puede ir en el frontend, pero **solo con RLS bien configurado** |
| `SUPABASE_SERVICE_ROLE_KEY` | Saltarse RLS desde el servidor | **Secreta. Nunca en el navegador ni en variables `VITE_*`** |

Si se usa `@supabase/supabase-js` en el navegador, las variables deben llamarse `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. La *service role* jamás debe llevar el prefijo `VITE_`, porque Vite la incrustaría en el bundle.

---

## 3. Migración a Supabase/PostgreSQL, paso a paso

### Paso 1. Crear el proyecto

1. Crea un proyecto en Supabase y guarda la contraseña de la base.
2. Copia la cadena de conexión.
3. No pegues claves en el chat ni en el repositorio. Guárdalas en `.env`, que está en `.gitignore`.

### Paso 2. Aplicar el esquema

Abre **SQL Editor** en Supabase y ejecuta el contenido de `db/schema.postgres.sql`, o usa `psql`:

```bash
psql "$DATABASE_URL" -f db/schema.postgres.sql
```

El esquema crea tablas, índices y restricciones. Revisa las notas de RLS al final del archivo antes de exponer tablas al cliente.

### Paso 3. Migrar los datos

La semilla actual (`server/seed-data.js`) inserta con la API de SQLite. Para migrar hay dos caminos:

- **Recomendado:** escribir un exportador que lea SQLite y genere un archivo JSON/SQL, y un importador que use el cliente PostgreSQL.
- **Alternativa:** exportar a CSV desde SQLite y usar el importador de Supabase, respetando el orden de claves foráneas.

Orden mínimo: `careers` → `subjects` → `topics` → `exercises` → `users` → `profiles` → `user_subjects` → `computers` → `computer_loans` → `companies` → `challenges` → `vacancies` → `technical_tests` → `applications` → `deliverables` → `favorites` → `progress` → `activity_log` → `study_goals` → `conversations` → `messages` → `notifications` → `reports`.

### Paso 4. Implementar el adaptador

Trabajo mínimo en el código:

1. Añadir `pg` a `dependencies`.
2. Crear `server/db-postgres.js` con un *pool* y helpers `query`, `get`, `all`, `run` y `transaction`.
3. Cambiar las rutas y helpers a `async/await`.
4. Traducir las consultas y las funciones de fecha.
5. Hacer que `seed.js` funcione con ambos motores o solo con PostgreSQL.
6. Añadir una suite de integración contra una base PostgreSQL real.
7. Probar registro, login, panel, favoritos, materias personales, préstamos de PCs, postulaciones, vacantes, pruebas técnicas, administración y reportes.

No se debe cambiar el motor sin repetir esas pruebas: una migración de base de datos no es un cambio de configuración.

### Paso 5. Validar

```sql
SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'exercises', COUNT(*) FROM exercises
UNION ALL SELECT 'challenges', COUNT(*) FROM challenges;
```

Después, con el adaptador activo:

1. `GET /api/health`
2. Login de los tres roles.
3. Panel de estudiante, materias personales y favoritos.
4. Préstamo y devolución de un computador.
5. Postulación y cambio de estado por la empresa.
6. Publicación de vacante y prueba técnica, con detalle público sin respuestas.
7. Publicar/ocultar un ejercicio desde administración.
8. Reinicio del servidor y verificación de que los datos persisten.

---

## 4. RLS y autorización

Hoy la autorización vive en Express: `requireAuth`, `requireRole` y validación de propiedad. Si se pasa a Supabase:

- **No** se debe confiar solo en ocultar rutas en React.
- Si el navegador habla directo con Supabase, hay que activar **Row Level Security** en todas las tablas y escribir políticas por rol y propietario.
- La *service role key* omite RLS. Si se usa en el servidor, el servidor sigue siendo responsable de autorizar; no se debe enviar al cliente.
- La clave `anon` es pública por diseño, pero sin políticas RLS permite leer lo que las políticas permitan. Revisa cada tabla.

Migrar la autenticación a Supabase Auth y migrar los datos son dos proyectos distintos. Se pueden hacer por separado.

---

## 5. Qué está implementado hoy

- [x] SQLite operativo con esquema idempotente.
- [x] Semilla y reset.
- [x] Esquema PostgreSQL de referencia, incluidas las tablas de materias personales, computadores, préstamos, vacantes y pruebas técnicas.
- [x] Documentación de las diferencias.
- [ ] Cliente PostgreSQL y adaptador asíncrono.
- [ ] Migración de datos ejecutada.
- [ ] Pruebas contra PostgreSQL/Supabase.
- [ ] RLS y políticas de Supabase.

Mientras esas casillas sigan vacías, la aplicación debe seguir presentándose como **demo local con SQLite**, no como una instalación conectada a Supabase.
