# CampusCode en Netlify + Render

La web `https://mi-campuscode.netlify.app` que está publicada ahora es un
prototipo estático hecho con Bolt.new. No tiene backend, no tiene rutas
`/login` ni `/registro` y los botones de sesión no hacen nada.

CampusCode necesita dos piezas:

1. **Netlify**: sirve el frontend real (React/Vite).
2. **Render**: ejecuta el backend Node/Express y la base SQLite.

Netlify reenvía `/api/*` a Render. Así el navegador ve un solo dominio y las
cookies de sesión funcionan sin problemas de CORS.

```text
https://mi-campuscode.netlify.app  →  frontend
https://mi-campuscode.netlify.app/api/*  →  https://campuscode-co.onrender.com/api/*
```

## 1. Publicar el backend en Render

Sigue `docs/RENDER.md`. Al terminar, comprueba:

```text
https://campuscode-co.onrender.com/api/health
```

Debe responder `{ "status": "ok" }`.

Si usas otro nombre de servicio en Render, cambia la URL en `netlify.toml`.

## 2. Conectar Netlify con el repositorio real

El sitio actual de Netlify es el prototipo de Bolt.new. Hay que reemplazarlo
por el repositorio `francusci/CampusCode`.

### Opción A: reutilizar el sitio actual

1. Netlify → tu sitio `mi-campuscode` → **Site configuration**.
2. **Build & deploy** → **Continuous deployment** → **Link repository**.
3. Conecta GitHub y elige `francusci/CampusCode`.
4. Netlify leerá `netlify.toml`:
   - Build command: `npm ci && npm run build`
   - Publish directory: `dist`
5. Despliega.

Si el sitio actual no permite vincular el repositorio, usa la opción B.

### Opción B: crear un sitio nuevo

1. Netlify → **Add new site** → **Import an existing project**.
2. Conecta GitHub y elige `francusci/CampusCode`.
3. Netlify usará `netlify.toml` automáticamente.
4. Despliega.
5. Si quieres conservar `mi-campuscode.netlify.app`:
   - Renombra el sitio viejo (Site configuration → General → Change site name).
   - Renombra el sitio nuevo a `mi-campuscode`.

## 3. Verificar

Abre:

```text
https://mi-campuscode.netlify.app/api/health
```

Debe devolver el JSON del backend. Luego prueba:

- Iniciar sesión con `estudiante@campuscode.co` / `Campus123!`.
- Registro de una cuenta nueva.
- Asistente académico.

## 4. Variables y contraseñas

- La clave de Gemini se configura en Render, no en Netlify.
- La contraseña del administrador se genera en Render:
  **Render → campuscode-co → Environment → ADMIN_PASSWORD**.
- Las cuentas demo de estudiante y empresa usan `Campus123!`.

## 5. Limitaciones

- El plan gratuito de Render duerme el backend tras unos minutos sin visitas.
  La primera petición puede tardar 30–60 segundos. Usa UptimeRobot para hacer
  ping a `/api/health` cada 5–10 minutos.
- SQLite es efímero en Render: al reiniciar se recargan los datos de
  demostración. Para conservar cuentas y progreso hace falta un disco
  persistente o migrar a PostgreSQL.
- El prototipo viejo de Netlify se puede dejar como respaldo, pero no tiene
  login ni registro funcionales.
