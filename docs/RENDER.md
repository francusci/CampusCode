# Publicar CampusCode en Render

Esta guía deja el proyecto en un repositorio de GitHub y lo publica en Render
con HTTPS y una URL fija.

> `https://campuscode.onrender.com` ya está ocupado por otra aplicación.
> El Blueprint usa `https://campuscode-co.onrender.com`, que estaba libre
> al momento de preparar esta guía. Si Render lo rechaza, cambia `name:` en
> `render.yaml` por otro nombre, por ejemplo `campuscode-demo`.

## 1. Vincular el proyecto a GitHub

### Opción A: desde la web de GitHub (recomendada)

1. Crea una cuenta en <https://github.com> si todavía no tienes.
2. Entra en <https://github.com/new>.
3. Nombre del repositorio: `campuscode`.
4. Visibilidad: `Private` o `Public`. Para Render funciona cualquiera.
5. **No** marques “Add a README”, “Add .gitignore” ni “Choose a license”.
   El repositorio debe crearse vacío.
6. Crea el repositorio y copia la URL, por ejemplo:
   `https://github.com/TU_USUARIO/campuscode.git`

En la carpeta del proyecto, ejecuta:

```powershell
git init
git add .
git commit -m "CampusCode: plataforma completa"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/campuscode.git
git push -u origin main
```

Si Git pide usuario y contraseña, usa tu usuario de GitHub y un **token
personal** como contraseña. Para crear el token:

1. GitHub → Settings → Developer settings → Personal access tokens.
2. Genera un token con permiso `repo`.
3. Úsalo cuando Git pida la contraseña.

### Opción B: con GitHub CLI

Instala GitHub CLI:

```powershell
winget install --id GitHub.cli
```

Autentícate y crea el repositorio en un solo paso:

```powershell
gh auth login
gh repo create campuscode --private --source=. --remote=origin --push
```

## 2. Crear el servicio en Render

1. Crea una cuenta en <https://render.com>.
2. En el panel, elige **New → Blueprint**.
3. Conecta tu cuenta de GitHub y autoriza el repositorio `campuscode`.
4. Render leerá `render.yaml` y mostrará el servicio `campuscode-co`.
5. Cuando pida `AI_API_KEY`, pega la clave de Google Gemini.
6. Aplica el Blueprint y espera el primer despliegue.

La URL quedará así:

```text
https://campuscode-co.onrender.com
```

## 3. Variables que configura Render

`render.yaml` ya define:

- `NODE_VERSION=24`
- `NODE_ENV=production`
- `JWT_SECRET` generado automáticamente
- `ADMIN_PASSWORD` generado automáticamente
- `DB_PATH=./data/campuscode.db`
- `AI_PROVIDER=openai`
- `AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`
- `AI_MODEL=gemini-3.5-flash`
- `AI_MAX_TOKENS=4096`
- `AI_TIMEOUT_MS=45000`
- `AI_MODE=live`

La `AI_API_KEY` se introduce en el panel de Render y no se guarda en GitHub.

La contraseña del administrador se puede consultar en:

```text
Render → campuscode-co → Environment → ADMIN_PASSWORD
```

Las cuentas de estudiante y empresa conservan `Campus123!`.

## 4. Verificar el despliegue

Cuando Render termine, abre:

```text
https://campuscode-co.onrender.com/api/health
```

Debe responder:

```json
{ "status": "ok", "service": "campuscode-api" }
```

Después abre la aplicación y prueba:

- Registro e inicio de sesión.
- Catálogo y banco de ejercicios.
- Asistente académico.
- Paneles de estudiante, empresa y administración.

## 5. Limitaciones del plan gratuito

### El servicio se duerme

Render apaga el servicio tras unos minutos sin visitas. La primera petición
tarda entre 30 y 60 segundos en despertarlo. Para mantenerlo activo:

1. Crea una cuenta gratis en <https://uptimerobot.com>.
2. Agrega un monitor HTTP para
   `https://campuscode-co.onrender.com/api/health`.
3. Configura una revisión cada 5 o 10 minutos.

Eso mantiene el servicio despierto dentro de las 750 horas gratuitas al mes.

### SQLite es efímero

El plan gratuito no incluye disco persistente. Cada vez que Render reinicia
o vuelve a desplegar, se borra `data/campuscode.db` y se recargan los datos de
demostración. Las cuentas y el progreso creados después del despliegue se
pierden en ese reinicio.

Para conservar datos hace falta una de estas opciones:

- Disco persistente de Render (plan pago).
- Migrar la base a PostgreSQL o Supabase (requiere implementar el adaptador).

## 6. Dominio propio (opcional)

Cuando la app esté estable en Render, puedes usar `campuscode.com`:

1. Render → campuscode-co → Settings → Custom Domains.
2. Agrega `campuscode.com` y `www.campuscode.com`.
3. Render te dará los registros DNS.
4. En Hover, crea los registros que indique Render.
5. Render emite el certificado HTTPS automáticamente.

Así el enlace final sería:

```text
https://campuscode.com
```

## 7. Seguridad

- No subas `.env`, `.env.production`, `.admin-password`, `data/*.db` ni
  `tools/cloudflared.exe` al repositorio.
- La clave de Gemini vive solo en las variables de Render.
- La contraseña de administrador se genera en Render y no se incluye en el
  informe ni en el repositorio.
- El túnel temporal de Cloudflare (`trycloudflare.com`) deja de ser necesario
  cuando Render esté funcionando.
