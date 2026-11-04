# Configuración del asistente de IA

CampusCode implementa una integración real con proveedores compatibles con la API de chat de OpenAI. La llamada se hace **exclusivamente desde el servidor**: la clave nunca se envía al navegador ni se incluye en el bundle.

> **Estado verificado:** en este entorno no se configuró una clave de IA. Por eso la aplicación funciona en **modo guía local** y así se muestra en la interfaz. El camino live está implementado y se probó con un proveedor simulado local para OpenAI-compatible y Anthropic, pero **no se probó contra un proveedor real** en esta entrega. No se debe afirmar que la integración externa funciona hasta configurar una clave y ejecutar una consulta.

---

## 1. Variables de entorno

Definidas en `.env` (parte de `.env.example`):

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `AI_PROVIDER` | No | `openai` (compatible con OpenAI, también DeepSeek/OpenRouter) o `anthropic`. Por defecto `openai`. |
| `AI_API_KEY` | No | Clave del proveedor. Si está vacía, se usa la guía local. |
| `AI_BASE_URL` | No | URL base del proveedor. Por defecto `https://api.openai.com/v1` o `https://api.anthropic.com/v1` según `AI_PROVIDER`. |
| `AI_MODEL` | No | Modelo a usar. Por defecto `gpt-4o-mini` o `claude-3-5-haiku-latest`. Debe existir en el proveedor. |
| `AI_MAX_TOKENS` | No | Tokens máximos de salida. Por defecto `900`. Súbelo si el modelo usa razonamiento interno (Gemini 3.5 Flash, por ejemplo). |
| `AI_TIMEOUT_MS` | No | Tiempo máximo de espera. Por defecto `45000`. |
| `AI_MODE` | No | `live` usa el proveedor si hay clave; `local` fuerza la guía local. |

Ejemplo para OpenAI:

```dotenv
AI_PROVIDER=openai
AI_API_KEY=sk-reemplaza-con-tu-clave
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_MS=45000
AI_MODE=live
```

Ejemplo para DeepSeek (compatible con OpenAI):

```dotenv
AI_PROVIDER=openai
AI_API_KEY=tu-clave
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
AI_MODE=live
```

Ejemplo para Gemini (compatible con OpenAI):

```dotenv
AI_PROVIDER=openai
AI_API_KEY=tu-clave-de-google-ai-studio
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-3.5-flash
AI_MAX_TOKENS=4096
AI_MODE=live
```

Los modelos Gemini con razonamiento interno consumen parte del presupuesto de tokens; con `AI_MAX_TOKENS=900` la respuesta puede cortarse. Usa `4096` o más.

Ejemplo para Anthropic (API nativa):

```dotenv
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-tu-clave
AI_BASE_URL=https://api.anthropic.com/v1
AI_MODEL=claude-3-5-haiku-latest
AI_MODE=live
```

Ejemplo para un proveedor compatible (sustituye la URL y el modelo por los de tu proveedor):

```dotenv
AI_PROVIDER=openai
AI_API_KEY=tu-clave
AI_BASE_URL=https://api.tu-proveedor.example/v1
AI_MODEL=nombre-del-modelo
AI_MODE=live
```

Después de editar `.env`, reinicia el servidor. En desarrollo, `npm run dev` recarga el servidor al cambiar archivos, pero un cambio de `.env` puede requerir detener y volver a iniciar el proceso.

---

## 2. Cómo se determina el modo

En `server/ai.js`:

```js
const configured = Boolean(apiKey) && !forcedLocal;
```

- `configured = true`: se llama al proveedor externo.
- `configured = false`: se responde con la guía local determinista.

`GET /api/ai/status` devuelve el estado real:

```json
{
  "configured": false,
  "mode": "local",
  "provider": null,
  "model": null,
  "message": "La IA no está conectada. El asistente responde con la guía de estudio local de CampusCode, claramente identificada."
}
```

Con una clave válida, `configured` pasa a `true`, `mode` a `live`, `provider` a `openai-compatible` o `anthropic`, y `model` muestra el modelo configurado.

La interfaz muestra este estado antes de la conversación y etiqueta cada respuesta:

- `Guía local · no generada por IA` para `provider = local-guide`.
- `Respuesta generada por IA` para `provider = openai-compatible` o `provider = anthropic`.

---

## 3. Flujo de una consulta

1. La persona escribe en `/asistente`.
2. El navegador llama a `POST /api/ai/guest` (visitante) o `POST /api/conversations/:id/messages` (sesión iniciada).
3. El servidor valida, limita la frecuencia y construye el historial (máximo 10 mensajes, 6.000 caracteres por mensaje).
4. `generateAiReply()` decide entre guía local y proveedor según `AI_API_KEY` y `AI_MODE`.
5. En modo live, según `AI_PROVIDER`, se envía una de estas peticiones:

**Compatible con OpenAI** (OpenAI, DeepSeek, OpenRouter, etc.):

```http
POST {AI_BASE_URL}/chat/completions
Authorization: Bearer {AI_API_KEY}
Content-Type: application/json
```

```json
{
  "model": "gpt-4o-mini",
  "temperature": 0.4,
  "max_tokens": 900,
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ]
}
```

**Anthropic nativo**:

```http
POST {AI_BASE_URL}/messages
x-api-key: {AI_API_KEY}
anthropic-version: 2023-06-01
Content-Type: application/json
```

```json
{
  "model": "claude-3-5-haiku-latest",
  "temperature": 0.4,
  "max_tokens": 900,
  "system": "...",
  "messages": [{ "role": "user", "content": "..." }]
}
```

6. La respuesta se guarda con `provider = openai-compatible` o `provider = anthropic` y se devuelve al navegador.
7. Si el proveedor falla, se devuelve un error 502/504 con un mensaje claro. **No se inventa una respuesta** ni se presenta la guía local como si fuera IA.

El *system prompt* prohíbe explícitamente ofrecer tutorías, sesiones, reservas o reuniones, y pide no inventar fuentes, normas ni estadísticas.

---

## 4. Guía local (sin credenciales)

La guía local **no es un modelo de lenguaje**. Es contenido determinista creado por el equipo del proyecto para que la interfaz sea recorrible sin claves.

- Detecta algunos temas por palabras clave (recursión, búsqueda binaria, límites, etc.).
- Devuelve una ruta de estudio genérica cuando no reconoce el tema.
- Incluye siempre una etiqueta visible de que no fue generada por IA.
- No simula latencia, tokens, modelo ni proveedor.
- No se guarda como si fuera una respuesta de un modelo: se almacena con `provider = local-guide`.

Esto permite demostrar el producto sin afirmar que existe una integración activa.

---

## 5. Verificación manual del modo live

Con una clave real y el servidor reiniciado:

1. Abre `/asistente`.
2. Comprueba que el aviso cambie a «Asistente conectado a un proveedor compatible con la API de OpenAI» (o «Asistente conectado a la API de Anthropic») y que muestre el modelo.
3. Envía una pregunta académica.
4. Verifica que la respuesta lleve la etiqueta «Respuesta generada por IA».
5. Revisa en la base `SELECT provider, content FROM messages ORDER BY created_at DESC LIMIT 5;` y confirma `openai-compatible` o `anthropic`.
6. Si el proveedor devuelve error, revisa la consola del servidor y la vigencia de la clave, la URL base y el nombre del modelo.

La ruta live también está cubierta por `tests/ai-providers.test.mjs`, que levanta un servidor local y comprueba las cabeceras y el cuerpo de ambos protocolos. Esa prueba **no demuestra** que una cuenta real tenga saldo, cuota o acceso al modelo.

También puedes comprobar el estado sin abrir el navegador:

```bash
curl http://localhost:4000/api/ai/status
```

---

## 6. Errores y diagnóstico

| Síntoma | Causa probable | Acción |
| --- | --- | --- |
| Siempre aparece «Guía local» | `AI_API_KEY` vacía o `AI_MODE=local` | Configura la clave y reinicia |
| El proveedor responde 404 | `AI_PROVIDER` o `AI_BASE_URL` no corresponden al protocolo | Usa `openai` para `/chat/completions` o `anthropic` para `/messages` |
| `AI_UPSTREAM_ERROR` | Proveedor rechazó la petición | Revisa clave, cuota, modelo y URL |
| `AI_TIMEOUT` | El proveedor tardó más de `AI_TIMEOUT_MS` | Aumenta el tiempo o prueba otro modelo |
| `AI_NETWORK_ERROR` | No hay salida de red o la URL es incorrecta | Verifica `AI_BASE_URL` y conectividad |
| `AI_EMPTY_RESPONSE` | Respuesta sin contenido | Prueba otro modelo/proveedor |

Los errores del proveedor se registran en el servidor; el navegador recibe un mensaje sin detalles sensibles.

---

## 7. Costos y privacidad

- Cada mensaje live consume tokens del proveedor configurado. No hay cálculo de costos en la aplicación.
- El historial se guarda en la base local de CampusCode y solo es accesible para la cuenta dueña de la conversación.
- No envíes datos personales reales al asistente en este entorno de demostración.
- Antes de un uso institucional, define política de retención, consentimiento y proveedor autorizado.

---

## 8. Pendientes

- Probar el modo live con una clave y un proveedor reales.
- Definir límites de gasto y alertas en el proveedor.
- Evaluar moderación/seguridad del contenido según el proveedor elegido.
- Considerar un rate limit compartido si se despliega en varias instancias.
