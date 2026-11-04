# Pruebas y evidencia de verificación

Este documento registra lo que se ejecutó sobre CampusCode, con comandos reproducibles y resultados observados. No sustituye una auditoría de producción: las limitaciones se indican al final.

**Fecha de la verificación final:** 20 de octubre de 2026 (hora local; 21 de octubre en UTC).
**Actualización:** 1 de noviembre de 2026 se verificó una consulta real con Gemini 3.5 Flash en modo live.
**Entorno:** Windows, PowerShell, Node.js 26.8.1, npm 11.19.0.
**Alcance:** API Express + SQLite, interfaz React/Vite, rutas públicas y paneles por rol, comportamiento responsive, modo local del asistente y modo live con Gemini.

---

## 1. Comandos ejecutados

Desde la raíz del proyecto:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

### 1.1 TypeScript

```text
> tsc -b
```

**Resultado:** exit code 0, sin errores de tipos.

### 1.2 ESLint

```text
✖ 19 problems (0 errors, 19 warnings)
```

**Resultado:** 0 errores. Las 19 advertencias son:

- 4 por exportar hooks/constantes junto a componentes (`react-refresh/only-export-components`) en `Button.tsx`, `auth.tsx` y `toast.tsx`.
- 15 por expresiones de dependencia en `useMemo` (`react-hooks/exhaustive-deps`) en pantallas de administración y empresa.

Son advertencias de estilo y optimización, no fallos funcionales. No se silenciaron con comentarios `eslint-disable`.

### 1.3 Pruebas de API

```bash
npm test
```

La suite crea una base SQLite temporal, aplica el esquema y la semilla, levanta Express en un puerto efímero y fuerza `AI_MODE=local`. **No modifica `data/campuscode.db`.** Además, `tests/ai-providers.test.mjs` levanta un proveedor HTTP local para verificar los dos protocolos de IA sin llamar a ninguna red externa.

```text
✔ modo live: proveedor compatible con OpenAI
✔ modo live: API nativa de Anthropic
✔ salud pública y catálogo de demostración
✔ login, cookie httpOnly y sesión activa
✔ registro, roles y cambios de estado del administrador
✔ autorización por rol aplicada en el servidor
✔ favoritos, progreso y objetivos del estudiante
✔ postulación a reto, duplicado y gestión por la empresa
✔ la empresa no puede editar retos de otra empresa
✔ campus: materias personales y préstamo de computadores
✔ reclutamiento: vacantes públicas, pruebas y gestión por empresa
✔ administración: catálogo, ejercicios y reportes
✔ IA sin credenciales se identifica como guía local
✔ protección de origen para peticiones mutantes
ℹ tests 14
ℹ pass 14
ℹ fail 0
```

Los tiempos exactos varían en cada ejecución; la salida anterior es la lista de pruebas y el conteo final.

| # | Prueba | Qué comprueba |
| --- | --- | --- |
| 1 | Modo live: proveedor compatible con OpenAI | Endpoint `/chat/completions`, `Authorization: Bearer`, modelo, system prompt y lectura de `choices[0].message.content` |
| 2 | Modo live: API nativa de Anthropic | Endpoint `/messages`, `x-api-key`, `anthropic-version`, modelo, system prompt y lectura de bloques `text` |
| 3 | Salud pública y catálogo de demostración | `/api/health`, resumen público, límite de ejercicios y consulta parametrizada frente a `' OR 1=1 --` |
| 4 | Login, cookie httpOnly y sesión activa | Rechazo de contraseña incorrecta, `HttpOnly`, `SameSite=Lax`, `/api/auth/me` |
| 5 | Registro, roles y cambios de estado del administrador | Alta de estudiante, desactivación, bloqueo de login, reactivación y autodegradación bloqueada |
| 6 | Autorización por rol aplicada en el servidor | Estudiante contra endpoints de empresa/admin, visitante contra objetivos, empresa contra admin y postulación |
| 7 | Favoritos, progreso y objetivos del estudiante | Alta/baja de favorito, completado, métricas del panel y CRUD de objetivos |
| 8 | Postulación a reto, duplicado y gestión por la empresa | Postulación, `409 DUPLICATE_APPLICATION`, visibilidad y cambio de estado por la empresa dueña |
| 9 | La empresa no puede editar retos de otra empresa | Propiedad del recurso con respuesta `404` |
| 10 | Campus: materias personales y préstamo de computadores | Resumen etiquetado, `/api/my-subjects` vacío/alta/duplicado/baja, equipo disponible, préstamo, `409 COMPUTER_IN_USE` y cierre de salida |
| 11 | Reclutamiento: vacantes públicas, pruebas y gestión por empresa | Vacantes abiertas, detalle público sin respuestas, CRUD de vacante y prueba, propiedad de otra empresa y limpieza |
| 12 | Administración: catálogo, ejercicios y reportes | Resumen, catálogo, publicar/ocultar ejercicio y moderar reporte |
| 13 | IA sin credenciales se identifica como guía local | Estado `configured:false`, `mode:local`, `provider:local-guide` y ausencia de persistencia en modo visitante |
| 14 | Protección de origen para peticiones mutantes | `403 ORIGIN_NOT_ALLOWED` con un `Origin` no autorizado |

**Alcance de las pruebas de IA:** las pruebas automatizadas validan el contrato HTTP y el parseo. Además, el 1 de noviembre de 2026 se ejecutó una consulta real con **Gemini 3.5 Flash** desde la URL pública y se verificó la etiqueta «Respuesta generada por IA». Otros proveedores reales no se probaron.

### 1.4 Build de producción

```bash
npm run build
```

**Resultado:** correcto.

```text
✓ 4645 modules transformed.
dist/assets/index-CMIZ6e2R.css   127.42 kB │ gzip:  25.71 kB
dist/assets/index-C4opsP-R.js  1,266.81 kB │ gzip: 328.14 kB
✓ built in 2.60s
```

Vite emite una advertencia porque el bundle principal supera el umbral configurado de 1100 kB. **No es un error de compilación**; sí es una señal de que conviene dividir el bundle por rutas antes de producción.

---

## 2. Arranque y semilla

```bash
npm run seed:reset
```

```text
[campuscode] Datos de demostración insertados:
  Carreras: 7
  Materias: 20
  Ejercicios: 43
  Retos: 7
  Usuarios: 7
```

Después del reinicio de la API:

```text
GET http://localhost:4000/api/health
{"status":"ok","service":"campuscode-api","time":"..."}
```

La interfaz de desarrollo se sirvió en `http://localhost:5173` con proxy `/api` hacia `http://localhost:4000`.

---

## 3. Verificación en navegador

Navegador de escritorio controlado por CDP (Chromium). Se revisaron rutas, acciones y consola. **No se detectaron errores de consola** en los recorridos realizados.

### 3.1 Rutas públicas

| Ruta | Verificación |
| --- | --- |
| `/` | Landing rediseñada: hero, accesos rápidos, campus en vivo etiquetado como demo, beneficios, carreras, vista de ejercicios, IA, progreso, retos, cómo funciona, empresas, FAQ, CTA y footer |
| `/catalogo` | Catálogo y filtros |
| `/catalogo/:id` | Detalle público de materia, temas y ejercicios asociados |
| `/carreras/:slug` | Detalle de carrera |
| `/ejercicios` | Banco con filtros por carrera, materia, dificultad, tipo y estado |
| `/ejercicios/:id` | Enunciado, respuesta, pista, procedimiento y favorito |
| `/asistente` | Modo visitante, aviso de guía local y envío de consulta |
| `/retos` | Catálogo de retos con etiquetas de demostración |
| `/retos/:slug` | Detalle y postulación (el parámetro acepta slug o ID) |
| `/empresas` | Propuesta para empresas, vacantes junior y pruebas técnicas públicas |
| `/sobre-nosotros` | Alcance, IA, privacidad y contexto académico |
| `/login` | Inicio de sesión y error de credenciales |
| `/registro` | Registro de estudiante |

### 3.2 Flujos autenticados

| Rol | Rutas y acciones verificadas |
| --- | --- |
| Estudiante | `/dashboard`, `/materias`, `/prestamo-pcs`, `/mi-progreso`, `/favoritos`, `/mis-retos`, `/perfil`, `/configuracion`; favorito, respuesta correcta/incorrecta, completar ejercicio, alta/baja de materia, préstamo y devolución, objetivos, cierre de sesión |
| Empresa | `/empresa`, `/empresa/retos`, `/empresa/retos/nuevo`, `/empresa/retos/:id`, `/empresa/postulaciones`, `/empresa/vacantes`, `/empresa/vacantes/nuevo`, `/empresa/pruebas`, `/empresa/pruebas/nuevo`, `/empresa/perfil`; edición de reto propio, vacante y prueba técnica, y cambio de estado de postulación |
| Administración | `/admin`, `/admin/usuarios`, `/admin/materias`, `/admin/ejercicios`, `/admin/retos`, `/admin/reportes`; activación de usuario, publicación de ejercicio y moderación |

### 3.3 Comprobaciones posteriores a la semilla final

- `/dashboard` mostró **8 de 43 ejercicios completados**, 1 en curso, 4 favoritos y 2 postulaciones, coherentes con la semilla.
- La serie de actividad de 14 días terminó en la fecha local actual; el día de hoy apareció como `20 de oct` con 0 ejercicios, sin desfase por UTC.
- `/asistente` mostró el aviso **«Guía local determinista de CampusCode»** y las etiquetas de proveedor local; no se presentó como IA generativa.
- Con sesión de estudiante, navegar a `/admin` redirigió a `/dashboard`. La autorización también se verificó directamente contra la API en las pruebas 4, 7 y 8.
- Con la cuenta de empresa se abrió `/empresa`: 1 reto abierto, 1 borrador, 1 postulación, 2 vacantes abiertas, 1 prueba publicada y las tablas de retos propios, sin errores de consola.
- `/empresa/vacantes` y `/empresa/pruebas` mostraron las etiquetas Demo y los totales de reclutamiento. Los formularios `/nuevo` y el editor de pruebas se revisaron a 390 px y 800 px.
- `/materias` inició vacío, el modal permitió agregar «Programación I» por carrera y la tarjeta apareció en el tablero. La baja quedó cubierta por la prueba de API.
- `/prestamo-pcs` mostró 12 equipos, 10 disponibles, 1 en uso y 1 en mantenimiento, con el formulario de sala, número, entrada/salida y estado.
- `/empresas#vacantes` mostró 6 vacantes abiertas y 5 pruebas publicadas; el modal «Ver temario» mostró preguntas sin respuestas correctas.
- Con la cuenta de administración se abrió `/admin`: 7 usuarios, 43 ejercicios, 7 retos, 2 postulaciones y 1 conversación, sin errores de consola.
- Cerrar sesión eliminó el acceso a rutas privadas y devolvió la navegación pública.
- El footer cambió entre enlaces públicos y enlaces de cuenta según la sesión.

---

## 4. Responsive

Se emularon viewports de **390 px (móvil), 820 px (tablet) y 1440 px (escritorio)** con Chrome DevTools Protocol y se comparó `documentElement.scrollWidth` contra `innerWidth`.

| Viewport | Resultado |
| --- | --- |
| 390 px | Sin scroll horizontal en `/`, `/catalogo`, `/empresas`, `/ejercicios`, `/retos`, `/materias`, `/prestamo-pcs`, `/dashboard`, `/empresa`, `/empresa/vacantes` y `/empresa/pruebas` |
| 820 px | Sin scroll horizontal en las rutas públicas y paneles revisados |
| 1440 px | Sin scroll horizontal en las rutas públicas y paneles revisados |

Las tablas anchas de administración y empresa usan contenedores con `overflow-x-auto`: la tabla desplaza dentro de su tarjeta y no arrastra toda la página. El chat del asistente, los formularios de vacante/prueba y las tarjetas del panel se ajustaron para no desbordar en móvil. Los botones flotantes y las barras de acción permanecen dentro del viewport.

**Limitación:** es emulación de viewport en Chromium, no una prueba en dispositivos Android o iPhone reales.

---

## 5. Capturas de evidencia

En `docs/evidence/`:

| Archivo | Contenido |
| --- | --- |
| `desktop-home.png` | Landing en escritorio |
| `cdp-desktop-home.png` | Landing a 1440 px vía CDP |
| `cdp-tablet-home.png` | Landing a 820 px vía CDP |
| `cdp-mobile-home.png` | Landing a 390 px vía CDP |
| `mobile-home.png` | Landing en viewport móvil |
| `mobile-ejercicios.png` | Banco de ejercicios en móvil |
| `mobile-retos.png` | Catálogo de retos en móvil |
| `mobile-materias.png` | Tablero personal de materias a 390 px |
| `mobile-prestamo-pcs.png` | Registro de PCs a 390 px |
| `mobile-vacante-editor.png` | Formulario de vacante a 390 px |
| `mobile-prueba-editor.png` | Formulario de prueba técnica a 390 px |
| `dashboard-reseed.png` | Panel de estudiante tras `seed:reset`: 8/43 completados, 1 en curso, 4 favoritos, 2 postulaciones |

Las capturas muestran la interfaz real; no son mockups.

---

## 6. Qué no se probó

Estas ausencias se declaran para no atribuir a la entrega una cobertura que no tiene:

1. **IA contra otros proveedores reales:** se verificó Gemini 3.5 Flash con una clave real y una consulta desde la URL pública. No se probaron cuentas reales de OpenAI, DeepSeek, OpenRouter ni Anthropic. Ver [`IA.md`](IA.md).
2. **PostgreSQL:** `db/schema.postgres.sql` es una referencia; no hay adaptador ni base PostgreSQL conectada.
3. **Correo transaccional, archivos y pagos:** no implementados.
4. **Carga y estrés:** no se ejecutaron pruebas de concurrencia ni de rendimiento.
5. **Matriz de navegadores:** la verificación visual se hizo en Chromium. No se probó Firefox, Safari ni WebViews móviles.
6. **Auditoría automática de accesibilidad:** se revisaron teclado, foco, etiquetas y regiones manualmente, pero no se ejecutó axe u otra herramienta dedicada.
7. **Seguridad ofensiva:** se probaron inyección SQL básica, autorización por rol, propiedad de recursos, origen y cookie; no hubo pentest ni escaneo de dependencias.
8. **Rate limit distribuido:** el limitador es en memoria y solo se validó en una instancia.

---

## 7. Cómo reproducir

```bash
npm install
Copy-Item .env.example .env
npm run seed:reset
npm test
npm run typecheck
npm run lint
npm run build
npm run dev
```

Abre `http://localhost:5173`, entra con `estudiante@campuscode.co` / `Campus123!` y recorre el panel. Para empresa y administración usa `empresa@campuscode.co` y `admin@campuscode.co` con la misma contraseña.

> Las pruebas automatizadas usan una base temporal. Para devolver la base de desarrollo a su estado inicial después de probar la interfaz, ejecuta `npm run seed:reset` con la API detenida y vuelve a iniciarla.
