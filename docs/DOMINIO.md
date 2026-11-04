# Dominio `campuscode.com` con Cloudflare Tunnel

**Estado:** configuración preparada. El dominio está registrado en Hover y todavía usa los nameservers `ns1.hover.com` / `ns2.hover.com`. Para publicar con Cloudflare Tunnel hay que mover el DNS a Cloudflare y completar el túnel.

**Resultado esperado:** `https://campuscode.com` y `https://www.campuscode.com` sirviendo la app con HTTPS, sin contratar un VPS.

> **Importante:** el túnel publica esta aplicación desde este PC. El equipo debe estar encendido y con el servidor y `cloudflared` en ejecución. Para disponibilidad 24/7 se necesita un VPS o un equipo siempre encendido.

---

## 1. Pasar el DNS de Hover a Cloudflare

1. Crea una cuenta gratuita en [dash.cloudflare.com](https://dash.cloudflare.com).
2. **Add a site** → escribe `campuscode.com` → plan **Free**.
3. Cloudflare mostrará dos nameservers, por ejemplo:
   - `ada.ns.cloudflare.com`
   - `bob.ns.cloudflare.com`
   (los nombres exactos cambian; usa los que muestre tu panel).
4. En Hover, abre el dominio `campuscode.com` → **DNS** / **Nameservers**.
5. Si Hover tiene **DNSSEC** activo, desactívalo antes de cambiar los nameservers. Podrás activarlo de nuevo en Cloudflare cuando el dominio esté activo.
6. Reemplaza `ns1.hover.com` y `ns2.hover.com` por los dos nameservers de Cloudflare.
7. Espera a que Cloudflare marque el sitio como **Active**. Puede tardar minutos u horas.
8. En Cloudflare → **DNS**, elimina los registros `A`/`AAAA` de `@` y `www` que apunten al parking de Hover (`216.40.34.41`) antes de crear las rutas del túnel.

No cambies los registros MX si usas correo con el dominio; el túnel solo necesita `campuscode.com` y `www`.

---

## 2. Autenticar Cloudflare Tunnel

El binario ya está descargado en `tools\cloudflared.exe`.

```powershell
tools\cloudflared.exe tunnel login
```

Se abrirá el navegador. Inicia sesión en Cloudflare, selecciona `campuscode.com` y autoriza. El certificado queda en `%USERPROFILE%\.cloudflared\cert.pem`.

---

## 3. Crear el túnel y las rutas DNS

```powershell
tools\cloudflared.exe tunnel create campuscode
```

Guarda el **UUID** que imprime y la ruta del archivo de credenciales (`%USERPROFILE%\.cloudflared\<UUID>.json`).

Crea las rutas públicas:

```powershell
tools\cloudflared.exe tunnel route dns campuscode campuscode.com
tools\cloudflared.exe tunnel route dns campuscode www.campuscode.com
```

Cloudflare creará los CNAME proxificados hacia `<UUID>.cfargotunnel.com`.

Copia `cloudflared\config.example.yml` como `cloudflared\config.yml` y reemplaza:

- `REEMPLAZA-CON-EL-UUID-DEL-TUNEL`
- La ruta del archivo de credenciales

El archivo `cloudflared/config.yml` está ignorado por Git porque contiene el identificador del túnel.

---

## 4. Arrancar la aplicación en modo producción

El archivo `.env.production` ya existe en local y está ignorado por Git. Contiene:

```dotenv
PORT=4000
APP_ORIGIN=https://campuscode.com,https://www.campuscode.com
DB_PATH=./data/campuscode.db
```

`NODE_ENV=production` no se guarda en ese archivo: lo fija `scripts/start-production.mjs` antes de cargar el servidor. Así Vite no lo confunde con un `.env` de desarrollo.

Genera el build y arranca Express:

```powershell
npm run build
npm run start:production
```

Comprueba en otra terminal:

```powershell
curl.exe http://localhost:4000/api/health
```

Debe responder `{"status":"ok",...}`.

---

## 5. Arrancar el túnel

En una terminal aparte, con la app en ejecución:

```powershell
tools\cloudflared.exe tunnel --config cloudflared\config.yml run campuscode
```

Verifica:

```powershell
curl.exe https://campuscode.com/api/health
```

Luego abre `https://campuscode.com` en el navegador. El certificado HTTPS lo emite Cloudflare automáticamente.

En Cloudflare → **SSL/TLS** → **Overview**, usa **Full** y activa **Always Use HTTPS**. No uses **Flexible**.

### URL temporal gratuita (sin dominio propio)

Mientras el DNS de `campuscode.com` no esté activo, se puede publicar una URL temporal con Cloudflare Quick Tunnel:

```powershell
npm run build
npm run start:production
# En otra terminal:
tools\cloudflared.exe tunnel --url http://localhost:4000
```

`cloudflared` imprime una URL `https://<nombre-aleatorio>.trycloudflare.com`. Es gratuita y tiene HTTPS, pero cambia cada vez que se reinicia el túnel y solo funciona mientras este PC y el servidor estén encendidos. No sustituye al dominio `campuscode.com`.

Para que el dominio canónico sea el apex, crea en Cloudflare → **Rules** → **Redirect Rules** una regla:

- Si `hostname` es `www.campuscode.com`, redirige a `https://campuscode.com` con estado `301` y conserva la ruta.

Así la sesión no se divide entre `www` y el dominio principal.

---

## 6. Seguridad antes de publicar

La semilla de demostración crea cuentas con contraseñas conocidas. **No publiques el sitio con la cuenta de administración demo activa.**

Cambia la contraseña de administración antes de abrir el dominio:

```powershell
node --env-file=.env.production scripts/set-password.mjs admin@campuscode.co "UnaClaveLargaYPropia"
```

También puedes cambiar las cuentas de estudiante y empresa si el sitio dejará de ser una demo abierta:

```powershell
node --env-file=.env.production scripts/set-password.mjs estudiante@campuscode.co "OtraClaveLarga"
node --env-file=.env.production scripts/set-password.mjs empresa@campuscode.co "OtraClaveLarga"
```

No publiques estas claves en el repositorio ni en la interfaz.

---

## 7. Mantenerlo encendido

Para una demostración, deja abiertas las dos terminales:

1. `npm run start:production`
2. `tools\cloudflared.exe tunnel --config cloudflared\config.yml run campuscode`

Para que arranque con Windows, crea una tarea programada para cada comando o instala `cloudflared` como servicio:

```powershell
tools\cloudflared.exe service install
```

El servicio necesita que `cloudflared\config.yml` esté en una ruta accesible por la cuenta del servicio. Para este proyecto, la opción más simple es una tarea programada al iniciar sesión.

---

## 8. Comprobaciones finales

- [ ] `https://campuscode.com/api/health` responde `status: ok`.
- [ ] `https://campuscode.com` carga la interfaz y no muestra errores de consola.
- [ ] `https://www.campuscode.com` redirige o sirve la misma app.
- [ ] El login funciona y la cookie `cc_session` es `Secure`, `HttpOnly` y `SameSite=Lax`.
- [ ] `/materias`, `/prestamo-pcs`, `/empresa` y `/admin` siguen protegidos.
- [ ] La contraseña de administración demo fue cambiada.
- [ ] El equipo no se suspende mientras el túnel está activo.

---

## 9. Si algo falla

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| Cloudflare no activa el dominio | Nameservers de Hover sin cambiar | Revisa los NS en Hover y espera propagación |
| `tunnel route dns` falla | Ya existe un A/AAAA para `@` o `www` | Bórralo en Cloudflare DNS y reintenta |
| `502 Bad Gateway` | La app no está en `localhost:4000` | Ejecuta `npm run start:production` |
| Error de origen/CSRF | `APP_ORIGIN` no coincide con el dominio | Ajusta `.env.production` y reinicia |
| El login no persiste | Estás probando por HTTP local con `NODE_ENV=production` | Usa `https://campuscode.com`; la cookie es `Secure` |
| El túnel se corta al cerrar sesión | El proceso se detuvo | Configura una tarea programada o un servicio |
