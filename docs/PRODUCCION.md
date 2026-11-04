# Guía de producción: IA, Supabase y despliegue

**Estado:** la aplicación funciona en local con SQLite y autenticación JWT propia. La IA puede activarse en vivo con una clave. La migración a PostgreSQL/Supabase y el cambio a Supabase Auth **no están implementados** todavía: son cambios de código, no solo de variables.

Este documento separa lo que puedes activar ahora de lo que requiere una segunda etapa.

---

## 1. Activar la IA real (disponible ahora)

### 1.1 Dónde va la clave

Archivo: `.env` en desarrollo y `.env.production` en la ejecución de producción. Ya existe una plantilla local con `JWT_SECRET` generado y una `AI_API_KEY` de prueba; la clave real se guarda solo en `.env.production`. **No subas ninguno de esos archivos al repositorio.**

```dotenv
AI_PROVIDER=openai
AI_API_KEY=tu-clave-real
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=4096
AI_TIMEOUT_MS=45000
AI_MODE=live
```

La clave se lee solo en `server/ai.js`. Nunca lleva el prefijo `VITE_`, nunca se envía al navegador y no aparece en `dist/`.

### 1.2 Presets por proveedor

**OpenAI**

```dotenv
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

**DeepSeek** (API compatible con OpenAI)

```dotenv
AI_PROVIDER=openai
AI_API_KEY=...
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

**OpenRouter u otra puerta compatible**

```dotenv
AI_PROVIDER=openai
AI_API_KEY=...
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=proveedor/modelo
```

**Gemini** (API compatible con OpenAI)

```dotenv
AI_PROVIDER=openai
AI_API_KEY=...
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-3.5-flash
AI_MAX_TOKENS=4096
```

Los modelos Gemini con razonamiento interno consumen parte del presupuesto de tokens. Con `AI_MAX_TOKENS=900` la respuesta puede cortarse; usa `4096` o más.

**Anthropic** (API nativa, soportada desde esta versión)

```dotenv
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-...
AI_BASE_URL=https://api.anthropic.com/v1
AI_MODEL=claude-3-5-haiku-latest
```

El modelo debe existir en tu cuenta. Si el proveedor cambia nombres, actualiza `AI_MODEL`; no se inventa un modelo.

### 1.3 Reiniciar y comprobar

```bash
# Detén el proceso de la API y vuelve a iniciarlo
npm run dev:server
```

En otra terminal:

```bash
curl http://localhost:4000/api/ai/status
```

Con una clave válida debe devolver algo equivalente a:

```json
{
  "configured": true,
  "mode": "live",
  "provider": "openai-compatible",
  "model": "gpt-4o-mini",
  "message": "Asistente conectado a un proveedor compatible con la API de OpenAI."
}
```

Luego abre `/asistente`, envía una pregunta y comprueba que la respuesta lleva **«Respuesta generada por IA»**. Si aparece «Guía local», la clave no se cargó, `AI_MODE=local` sigue activo o el servidor no se reinició.

### 1.4 Qué se verificó y qué no

- **Verificado:** el camino live se probó con un proveedor simulado local para OpenAI-compatible y Anthropic. Las pruebas comprueban endpoint, cabeceras, modelo, cuerpo y lectura de la respuesta. Son 2 pruebas nuevas dentro de `npm test`.
- **Verificado con proveedor real:** el 1 de noviembre de 2026 se ejecutó una consulta real con **Gemini 3.5 Flash** desde la URL pública y se confirmó la etiqueta «Respuesta generada por IA».
- **No verificado:** cuentas reales de OpenAI, DeepSeek, OpenRouter o Anthropic. No se presentan como probadas.

### 1.5 Si el proveedor falla

| Código | Significado | Acción |
| --- | --- | --- |
| `AI_UPSTREAM_ERROR` | El proveedor rechazó la petición | Revisa clave, cuota, modelo y URL |
| `AI_TIMEOUT` | Superó `AI_TIMEOUT_MS` | Aumenta el tiempo o usa un modelo más rápido |
| `AI_NETWORK_ERROR` | No hay salida o la URL es incorrecta | Revisa `AI_BASE_URL` y conectividad |
| `AI_EMPTY_RESPONSE` | Respuesta sin texto | Prueba otro modelo |

No se inventa una respuesta si el proveedor falla.

> **Build:** no definas `NODE_ENV=development` dentro de `.env`. Vite puede incluirlo en el build y arrastrar React de desarrollo; el bundle pasó de ~1,27 MB a ~1,60 MB en una prueba. Deja la variable sin definir en local y expórtala como `NODE_ENV=production` en el entorno de despliegue.

---

## 2. Supabase Auth: qué implica realmente

### 2.1 Estado actual

- Login propio: `POST /api/auth/login`.
- Contraseñas con bcrypt en la tabla `users`.
- Sesión JWT firmada en cookie `httpOnly` `cc_session`.
- Roles `student`, `company`, `admin` y propiedad de recursos comprobados en Express.
- Rate limit en memoria.

No hay Supabase, Google OAuth ni confirmación de correo en el flujo local.

### 2.2 Por qué no es solo cambiar endpoints

Si el navegador empieza a llamar directamente a `https://<ref>.supabase.co/auth/v1`, hay que resolver:

1. **SDK y variables públicas:** `@supabase/supabase-js`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
2. **Mapeo de identidad:** Supabase devuelve un `auth.users.id` distinto de los IDs locales. Hay que crear o enlazar un registro en la tabla de perfiles y asignar el rol.
3. **Autorización:** Supabase Auth autentica, pero no decide si alguien es empresa o administrador. Eso debe seguir en una tabla de roles y en políticas RLS o en el servidor.
4. **Cookies y CSRF:** el flujo actual usa cookie `httpOnly`; Supabase usa tokens de sesión en el cliente. Hay que decidir si se mantiene la cookie del servidor o se pasa a tokens del SDK.
5. **RLS:** si el cliente lee tablas directamente, cada tabla necesita políticas. La *service role* no puede estar en el navegador.
6. **Rate limit:** Supabase tiene sus propios límites, pero la aplicación sigue necesitando límites para el asistente y para acciones sensibles. Delegar el login no elimina ese requisito.
7. **Pruebas:** la suite actual asume login local y cookie. Habría que reescribirla.

Por eso **no se cambió la autenticación a ciegas**: sin un proyecto Supabase real no se puede verificar el flujo ni las políticas RLS, y se rompería una aplicación que hoy funciona.

### 2.3 Configuración en el panel de Supabase

Estos ajustes se hacen en el proyecto, no en este repositorio:

**Confirmación de correo**

1. Supabase Dashboard → **Authentication** → **Sign In / Providers** → **Email**.
2. Desactiva **Confirm email** si quieres permitir el acceso inmediato tras el registro.
3. Guarda y prueba con un correo real.
4. Ten en cuenta que desactivar la confirmación permite registrar correos que no pertenecen a la persona. Para producción es preferible mantenerla y configurar el envío de correos.

El registro local actual **no pide confirmación por correo**; si migras a Supabase, el comportamiento lo decide ese interruptor.

**Google**

1. Crea credenciales OAuth en Google Cloud Console.
2. Supabase Dashboard → **Authentication** → **Providers** → **Google**.
3. Pega Client ID y Client Secret.
4. Configura **Site URL** y **Redirect URLs** con el dominio real.
5. Añade el botón de Google en la interfaz y maneja el callback.

Hoy **no hay botón de Google** porque no hay OAuth configurado. Añadir un botón que no funciona sería una función falsa. Cuando existan las credenciales, se implementa y se prueba.

### 2.4 Variables si se adopta Supabase

```dotenv
# Públicas (solo si el navegador usa el SDK)
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

# Servidor
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # nunca en VITE_*
DATABASE_URL=postgresql://...
```

La *service role* omite RLS. Si se usa en el servidor, el servidor debe seguir autorizando cada operación. Nunca debe llegar al bundle.

### 2.5 Ruta recomendada

**Opción A — conservar la seguridad actual (recomendada para esta demo):**

- Mantener JWT propio, bcrypt, roles y cookie `httpOnly`.
- Conectar solo la IA.
- Migrar la base a PostgreSQL cuando exista un adaptador probado.
- Añadir Google más adelante como proveedor adicional, manteniendo el mapeo de roles en el servidor.

**Opción B — Supabase Auth completo:**

- Implementar el SDK, el callback, el mapeo de perfiles y RLS.
- Reescribir login, registro, recuperación y pruebas.
- Verificar con un proyecto real antes de desplegar.
- No mezclar la *service role* con el cliente.

Si eliges B, se puede hacer en una segunda etapa con un proyecto Supabase de pruebas. No es un cambio de `.env`.

---

## 3. Rate limit

Hoy es un `Map` en memoria (`server/auth.js`). Funciona en una instancia. En producción:

- Varias instancias → límites independientes y inconsistentes.
- Reinicio → se pierde el conteo.
- Supabase Auth tiene límites propios, pero no cubre el asistente ni los endpoints de negocio.

Para producción se recomienda un almacén compartido (Redis, Upstash o una tabla PostgreSQL) o un servicio de gateway. No se implementó porque añade infraestructura y debe probarse con el despliegue real.

---

## 4. Responsive y Tailwind

La interfaz usa Tailwind CSS 4 con enfoque mobile-first. No es necesario que **cada** clase lleve `sm:`/`md:`/`lg:`; lo importante es que los layouts cambien donde hace falta.

Ya verificado:

- 390 px, 820 px y 1440 px sin scroll horizontal de página.
- Tablas administrativas con scroll interno.
- Chat y tarjetas sin desbordamiento en móvil.
- Menú móvil y navegación por teclado.

Al añadir componentes:

1. Parte de una columna y añade `sm:grid-cols-2`, `lg:grid-cols-3` cuando el contenido lo permita.
2. Evita anchos fijos sin `max-w-full` o `min-w-0`.
3. Usa `overflow-x-auto` en tablas, no en la página.
4. Prueba a 390 px antes de dar por terminado un layout.
5. No ocultes acciones esenciales solo con `hidden`; usa menús accesibles.

---

## 5. Checklist para publicar

- [ ] `JWT_SECRET` de producción (no el de desarrollo).
- [ ] `NODE_ENV=production`.
- [ ] `APP_ORIGIN` con el dominio real.
- [ ] HTTPS y proxy inverso o Cloudflare Tunnel ([`docs/DOMINIO.md`](DOMINIO.md)).
- [ ] Contraseñas demo cambiadas antes de exponer el sitio.
- [ ] DNS de `campuscode.com` activo en Cloudflare.
- [ ] `npm run start:production` y el túnel en ejecución.
- [ ] `AI_API_KEY` y proveedor verificados con una consulta real.
- [ ] Base de datos elegida y migrada (SQLite o PostgreSQL con adaptador).
- [ ] Copias de seguridad y restauración probadas.
- [ ] Rate limit compartido.
- [ ] Correo transaccional si se usa confirmación o recuperación.
- [ ] Política de privacidad y tratamiento de datos.
- [ ] Revisión de RLS si el cliente accede a Supabase.
- [ ] Pruebas de regresión tras la migración.
- [ ] Auditoría de accesibilidad y matriz de navegadores.

---

## 6. Qué necesito para continuar con Supabase

Para implementar la migración sin romper la aplicación necesito:

1. Confirmar **Opción A** (PostgreSQL con JWT propio) u **Opción B** (Supabase Auth completo).
2. Un proyecto Supabase de pruebas o un PostgreSQL accesible.
3. Las variables en `.env` (no en el chat): `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` y, si aplica, `SUPABASE_SERVICE_ROLE_KEY`.
4. Confirmar si el frontend hablará directo con Supabase o si todo pasará por Express.
5. Ejecutar la migración y la suite contra esa base antes de declararla terminada.

Con esos datos se puede hacer el adaptador, migrar la semilla y verificar los tres roles. Sin ellos, cualquier afirmación de «Supabase conectado» sería falsa.
