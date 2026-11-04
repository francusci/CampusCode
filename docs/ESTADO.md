# Estado del proyecto

**Actualizado:** 1 de noviembre de 2026.
**Estado general:** aplicación full-stack funcional y verificable, publicada en una URL temporal con HTTPS e IA live verificada. No es un despliegue de producción a escala.

CampusCode cubre las áreas solicitadas: banco de ejercicios, asistente académico, progreso académico, materias personales, préstamo de computadores, retos de empresas y un portal de reclutamiento con vacantes y pruebas técnicas. La autenticación y las autorizaciones se validan en el servidor. Las funciones que dependen de credenciales o infraestructura externa están separadas y marcadas como pendientes.

---

## 1. Funciones implementadas

### 1.1 Sitio público

- [x] Landing con hero rediseñado, accesos rápidos, campus en vivo etiquetado como demostración, beneficios, carreras y materias, vista previa de ejercicios, asistente, progreso, retos, cómo funciona, propuesta para empresas, vacantes, pruebas técnicas, FAQ, CTA final y footer completo.
- [x] Rutas públicas: `/`, `/catalogo`, `/catalogo/:id`, `/carreras/:slug`, `/ejercicios`, `/ejercicios/:id`, `/asistente`, `/retos`, `/retos/:slug`, `/empresas`, `/sobre-nosotros`, `/login`, `/registro`.
- [x] `/materias/:id` se conserva como alias histórico del detalle público; la navegación actual usa `/catalogo/:id`.
- [x] Navegación responsive, menú móvil, footer con enlaces por rol y estado de sesión.
- [x] Etiquetas visibles de contenido de demostración y empresas ficticias.
- [x] Página de contexto académico, alcance, IA y privacidad.

### 1.2 Banco de ejercicios

- [x] 43 ejercicios de demostración en 7 carreras, 20 materias y 40 temas.
- [x] Filtros por carrera, materia, tema, dificultad, tipo de respuesta, estado y búsqueda.
- [x] Detalle con enunciado, pista, respuesta, verificación y procedimiento.
- [x] Completar ejercicio y registrar actividad.
- [x] Favoritos con alta y baja.
- [x] Estados de carga, error, vacío y sin resultados.
- [x] Ejercicios publicados/ocultos controlados desde administración.

### 1.3 Asistente académico

- [x] Integración de servidor con API compatible con OpenAI (`/chat/completions`) y API nativa de Anthropic (`/messages`), clave solo en variables de entorno.
- [x] Modo visitante (`POST /api/ai/guest`) y conversaciones autenticadas con historial.
- [x] Guía local determinista cuando no hay credenciales; etiquetada como **no generada por IA**.
- [x] `GET /api/ai/status` con estado real (`configured`, `mode`, `model`, mensaje).
- [x] Errores diferenciados de proveedor, timeout, red y respuesta vacía.
- [x] Límite de mensajes y validación de longitud.
- [x] El *system prompt* prohíbe tutorías, reservas, sesiones y datos inventados.
- [x] Documentación en [`IA.md`](IA.md).
- [x] Verificación contra un proveedor real: **Gemini 3.5 Flash**, consulta live verificada el 1 de noviembre de 2026.

### 1.4 Progreso académico

- [x] Panel con ejercicios completados, en curso, favoritos y postulaciones.
- [x] Serie de actividad de 14 días calculada en fecha local.
- [x] Avance por materia y actividad reciente.
- [x] Objetivos personales con creación, edición, completado y eliminación.
- [x] Página de progreso detallada y recomendaciones según carrera.
- [x] Sin métricas de uso inventadas: todo sale de la base de demostración.

### 1.5 Materias personales y préstamo de computadores

- [x] `/materias` es una vista privada y personal; no muestra el catálogo global.
- [x] El tablero empieza vacío y permite agregar materias publicadas por carrera con el botón flotante `+`.
- [x] Modal con carrera, materia, semestre y créditos; duplicados bloqueados con `409`.
- [x] Eliminación de materias del tablero con confirmación y verificación de propiedad.
- [x] `/prestamo-pcs` disponible para cualquier usuario autenticado.
- [x] Inventario de 12 equipos de demostración, filtros por sala, disponibilidad y estado.
- [x] Registro de préstamo con sala, número de equipo, hora de entrada/salida, estado del PC y observaciones.
- [x] Préstamos activos, historial y cierre de salida; el equipo vuelve a disponible o pasa a mantenimiento.
- [x] Validación en servidor de equipo existente, mantenimiento, préstamo activo y horas coherentes.

### 1.6 Retos de empresas

- [x] Catálogo público y detalle con empresa, categoría, fecha límite y estado.
- [x] Postulación de estudiantes con mensaje; duplicados bloqueados.
- [x] Retiro de postulación y entregables por enlace (`http`/`https`) con notas.
- [x] Panel de empresa con resumen, CRUD de retos propios, cierre y postulaciones.
- [x] Cambio de estado de postulación por la empresa dueña.
- [x] Verificación de propiedad en el servidor, no solo en la interfaz.
- [x] Retos en borrador y cerrados excluidos del catálogo público cuando corresponde.

### 1.7 Portal de reclutamiento y pruebas técnicas

- [x] Las empresas pueden publicar vacantes de empleo, práctica o junior, en borrador, abiertas o cerradas.
- [x] Campos de descripción, requisitos, ubicación, modalidad, rango salarial y fecha límite.
- [x] Portal público de vacantes abiertas en `/empresas#vacantes`, con etiquetas de demostración.
- [x] Pruebas técnicas con preguntas abiertas o de opción múltiple, duración y puntaje mínimo.
- [x] Vinculación opcional de una prueba a una vacante de la misma empresa.
- [x] Edición de vacantes y pruebas solo por la empresa propietaria, validada en el servidor.
- [x] La vista pública de pruebas omite las respuestas correctas y las preguntas de referencia.

### 1.8 Administración

- [x] Resumen con conteos del sistema.
- [x] Usuarios: búsqueda, rol, activación/desactivación y protección contra autodegradación.
- [x] Catálogo de carreras y materias.
- [x] Ejercicios: publicar u ocultar.
- [x] Retos: moderación y estado.
- [x] Reportes: listado y revisión.
- [x] Rutas protegidas por rol en el servidor y guardas de interfaz.

### 1.9 Autenticación y seguridad

- [x] Registro de estudiante y empresa; login y logout.
- [x] Contraseñas con bcrypt (12 rondas).
- [x] JWT firmado en cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción, 7 días.
- [x] Roles `student`, `company`, `admin` comprobados en cada endpoint privado.
- [x] Relectura de sesión y estado activo desde la base.
- [x] Validación centralizada de entrada y consultas SQL parametrizadas.
- [x] Guardia de origen para métodos mutantes.
- [x] Rate limit de login, registro y mensajes de IA.
- [x] Cabeceras de seguridad; HSTS y CSP en producción.
- [x] Body limit de 120 KB y errores internos sin stack trace.
- [ ] Rate limit compartido entre instancias: pendiente (hoy en memoria).

### 1.10 Base de datos y datos de demostración

- [x] Esquema SQLite idempotente en `db/schema.sql`.
- [x] Claves foráneas, WAL y `busy_timeout` activos.
- [x] Semilla determinista y comando de reset.
- [x] Tablas `user_subjects`, `computers`, `computer_loans`, `vacancies` y `technical_tests` en SQLite.
- [x] Esquema PostgreSQL de referencia actualizado con las nuevas tablas e índices.
- [x] Cuentas demo de estudiante, empresa y administración.
- [ ] Adaptador PostgreSQL y migración ejecutada: pendiente.
- [ ] Copias de seguridad y retención: pendiente de infraestructura.

### 1.11 Interfaz y accesibilidad

- [x] Identidad visual propia: navy profundo, azul eléctrico, blanco, grises y gradientes contenidos.
- [x] Tipografías Instrument Sans y JetBrains Mono; logo SVG propio.
- [x] Componentes reutilizables de botón, campo, tarjeta, badge, modal, tabla, estado vacío, carga y error.
- [x] Enlace «Saltar al contenido principal» en layout público y paneles.
- [x] Foco visible, etiquetas de formulario, `aria-label` en acciones con icono y regiones anunciadas.
- [x] Confirmaciones antes de acciones destructivas.
- [x] Notificaciones y mensajes de validación.
- [x] Respeto de `prefers-reduced-motion`.
- [x] Responsive verificado a 390, 820 y 1440 px.
- [ ] Auditoría automatizada de accesibilidad (axe u otra): pendiente.
- [ ] Prueba en dispositivos físicos y matriz de navegadores: pendiente.

### 1.12 Pruebas y documentación

- [x] Suite de integración con 14 pruebas: 12 de API y 2 del camino live contra un proveedor simulado local.
- [x] `typecheck`, `lint` y `build` ejecutados.
- [x] Evidencia en [`PRUEBAS.md`](PRUEBAS.md) y capturas en `docs/evidence/`.
- [x] README con instalación, rutas, API, seguridad y configuración.
- [x] Documentación de IA, base de datos y producción.
- [x] Prueba contra un proveedor de IA real: Gemini 3.5 Flash, verificada con una consulta desde la URL pública.

---

## 2. Lo que deliberadamente no existe

CampusCode **no ofrece tutorías**. En el código, las rutas, los textos y los datos no hay:

- Tutores ni perfiles de tutor.
- Reservas, sesiones, horarios ni calendarios de disponibilidad.
- Pagos por tutoría, pasarela de cobro ni suscripciones.
- Métricas reales de estudiantes o empresas.

El acompañamiento se limita al banco de ejercicios, la guía local o la respuesta del proveedor de IA, y los retos publicados por empresas.

Tampoco se implementaron:

- Postulación o seguimiento de candidaturas dentro de las vacantes; el portal publica vacantes y pruebas, no un ATS.
- Resolución o calificación automática de las pruebas técnicas desde la cuenta de estudiante.
- Envío de correos transaccionales (las notificaciones son internas).
- Carga de archivos (los entregables son enlaces).
- Analítica de producto o estadísticas de uso.
- Aplicación móvil nativa.

---

## 3. Datos de demostración

| Dato | Cantidad | Tratamiento |
| --- | --- | --- |
| Carreras | 7 | Catálogo de ejemplo |
| Materias | 20 | Catálogo de ejemplo |
| Temas | 40 | Catálogo de ejemplo |
| Ejercicios | 43 | Contenido original de demostración |
| Retos | 7 | `is_demo = 1`, algunos en borrador o cerrados |
| Empresas | 5 | Ficticias, `is_demo = 1`, con etiqueta visible |
| Usuarios | 7 | Cuentas de demostración |
| Computadores | 12 | Equipos ficticios en tres salas |
| Préstamos | 4 | Activos e históricos de ejemplo |
| Vacantes | 7 | 6 abiertas y 1 en borrador |
| Pruebas técnicas | 6 | 5 publicadas y 1 en borrador |

- El progreso, los favoritos, las postulaciones, las notificaciones, los préstamos y la conversación inicial son ejemplos cargados para la cuenta de estudiante.
- La interfaz etiqueta los retos, empresas, equipos, préstamos, vacantes y pruebas como demostración; no se presentan como alianzas ni procesos reales.
- Las métricas del campus en la portada son ficticias y llevan un aviso explícito.
- `npm run seed:reset` restaura el estado inicial. Detén la API antes de ejecutarlo si el archivo está en uso.

### Cuentas

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Estudiante | `estudiante@campuscode.co` | `Campus123!` |
| Empresa | `empresa@campuscode.co` | `Campus123!` |
| Administración | `admin@campuscode.co` | `Campus123!` |

Las empresas adicionales (`aurora@`, `legal@`, `pacifico@`, `eco@campuscode.co`) usan la misma contraseña.

---

## 4. Estado verificado

| Área | Estado | Evidencia |
| --- | --- | --- |
| TypeScript | Correcto | `npm run typecheck` sin errores |
| ESLint | Correcto con advertencias | 0 errores, 19 advertencias |
| API | Correcta | 14/14 pruebas |
| Build | Correcto con advertencia de tamaño | `dist/` generado, bundle 1,27 MB |
| Rutas públicas | Verificadas en Chromium | Navegación y consola sin errores |
| Paneles por rol | Verificados | Estudiante, empresa y administración |
| Materias personales | Verificadas | Alta y eliminación desde `/materias` |
| Préstamo de PCs | Verificado | Registro, duplicado bloqueado, salida y liberación |
| Vacantes y pruebas | Verificadas | CRUD de empresa y vista pública sin respuestas |
| Autorización de servidor | Verificada | Pruebas de rol y propiedad |
| Responsive | Verificado por emulación | 390, 820 y 1440 px sin scroll de página, incluidas las vistas nuevas |
| IA local | Verificada | Etiqueta `local-guide` y estado `local` |
| IA live (protocolo) | Verificada con proveedor simulado | OpenAI-compatible y Anthropic |
| IA live (proveedor real) | Verificada con Gemini 3.5 Flash | Consulta real desde `/asistente` y la URL pública |
| PostgreSQL | **No conectado** | Solo esquema de referencia |

Detalle reproducible en [`PRUEBAS.md`](PRUEBAS.md).

---

## 5. Pendientes para producción

### Obligatorios antes de publicar

1. **`JWT_SECRET`**: definir un secreto largo y aleatorio. En producción el servidor no arranca sin él.
2. **`APP_ORIGIN` y HTTPS**: configurar el dominio real, certificado y proxy inverso. La cookie pasa a `Secure` y se activan HSTS y CSP. Para `campuscode.com` hay una configuración preparada con Cloudflare Tunnel en [`DOMINIO.md`](DOMINIO.md); falta mover los nameservers de Hover a Cloudflare.
3. **Variables de IA**: definir `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` y `AI_MODE=live`; ejecutar una consulta real y confirmar el proveedor. Si no se configura, la aplicación sigue funcionando en modo local, pero no debe anunciarse IA activa. Ver [`PRODUCCION.md`](PRODUCCION.md).
4. **Base de datos**: decidir entre SQLite para una sola instancia o implementar el adaptador PostgreSQL con `db/schema.postgres.sql`. Ver [`BASE-DE-DATOS.md`](BASE-DE-DATOS.md).
5. **Copias de seguridad**: programar respaldos y probar la restauración.
6. **Supabase Auth**: si se adopta, implementar SDK, mapeo de roles, RLS y pruebas. No es un cambio de variables.
7. **Contraseñas demo**: la cuenta `admin@campuscode.co` ya fue rotada. Si el sitio deja de ser una demo abierta, cambia también las cuentas conocidas de estudiante y empresa antes de publicar el dominio.

### Recomendados

8. **Rate limit distribuido** si se despliega en más de una instancia.
9. **Correo transaccional** para verificación, recuperación de contraseña y avisos.
10. **Almacenamiento de archivos** si los entregables deben adjuntarse en lugar de enlazarse.
11. **Observabilidad**: logs estructurados, métricas, alertas y trazas de errores.
12. **División del bundle** por rutas para bajar el tamaño inicial.
13. **Auditoría de accesibilidad** automatizada y con personas usuarias.
14. **Matriz de navegadores y dispositivos** reales.
15. **Revisión legal**: términos, privacidad, consentimiento y tratamiento de datos.
16. **Política de IA**: proveedor autorizado, retención, límites de gasto y moderación.
17. **Analítica real** solo con consentimiento y separada de los datos de demostración.

---

## 6. Mapa de documentación

| Documento | Contenido |
| --- | --- |
| [`../README.md`](../README.md) | Instalación, scripts, rutas, API, seguridad y configuración |
| [`IA.md`](IA.md) | Variables, modo local/live, diagnóstico y privacidad |
| [`BASE-DE-DATOS.md`](BASE-DE-DATOS.md) | SQLite, PostgreSQL y migración a Supabase |
| [`DOMINIO.md`](DOMINIO.md) | Publicación de `campuscode.com` con Cloudflare Tunnel |
| [`PRODUCCION.md`](PRODUCCION.md) | IA live, Supabase Auth, rate limit y despliegue |
| [`PRUEBAS.md`](PRUEBAS.md) | Comandos, resultados, rutas verificadas y capturas |
| `evidence/` | Capturas de la interfaz en móvil, tablet y escritorio |

---

## 7. Conclusión

La entrega es una **demostración full-stack funcional**: se puede instalar, sembrar, probar y recorrer con tres roles. La IA live con Gemini 3.5 Flash está verificada. PostgreSQL, correo transaccional, archivos, dominio permanente y HTTPS con el dominio propio siguen explícitamente pendientes. No se presentan integraciones no probadas como activas.
