import { httpError } from './validate.js';

const apiKey = process.env.AI_API_KEY?.trim();
const requestedProvider = (process.env.AI_PROVIDER || 'openai-compatible').trim().toLowerCase();
const isAnthropic = requestedProvider === 'anthropic' || requestedProvider === 'claude';
const provider = isAnthropic ? 'anthropic' : 'openai-compatible';
const baseUrl = (
  process.env.AI_BASE_URL || (isAnthropic ? 'https://api.anthropic.com/v1' : 'https://api.openai.com/v1')
).replace(/\/+$/, '');
const model = process.env.AI_MODEL || (isAnthropic ? 'claude-3-5-haiku-latest' : 'gpt-4o-mini');
const timeout = Number(process.env.AI_TIMEOUT_MS || 45000);
const maxTokens = Number(process.env.AI_MAX_TOKENS || 900);
const forcedLocal = process.env.AI_MODE === 'local';
const configured = Boolean(apiKey) && !forcedLocal;

export function aiStatus() {
  return {
    configured,
    mode: configured ? 'live' : 'local',
    provider: configured ? provider : null,
    model: configured ? model : null,
    message: configured
      ? isAnthropic
        ? 'Asistente conectado a la API de Anthropic.'
        : 'Asistente conectado a un proveedor compatible con la API de OpenAI.'
      : 'La IA no está conectada. El asistente responde con la guía de estudio local de CampusCode, claramente identificada.',
  };
}

const SYSTEM_PROMPT = `Eres el asistente académico de CampusCode, una plataforma para estudiantes universitarios.
Tu objetivo es ayudar a comprender conceptos, procedimientos y razonamiento académico.
Reglas:
- Responde en español claro, con ejemplos concretos.
- Explica el procedimiento paso a paso antes de dar un resultado.
- No resuelvas tareas completas sin explicar el razonamiento; prioriza el aprendizaje autónomo.
- Usa Markdown, bloques de código con lenguaje cuando corresponda y notación matemática legible.
- Si la pregunta es ambigua, pide una aclaración breve.
- No inventes fuentes, normas, datos de la universidad ni estadísticas.
- En temas de salud, derecho o finanzas, aclara que la orientación es educativa y no reemplaza asesoría profesional.
- No ofrezcas tutorías, sesiones, reservas ni reuniones: CampusCode no presta ese servicio.
- Si no sabes algo, dilo.`;

function cleanHistory(messages) {
  return messages
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: String(message.content).slice(0, 6000),
    }));
}

export async function generateAiReply({ messages, subjectName }) {
  if (!configured) {
    return {
      provider: 'local-guide',
      content: buildLocalGuide(messages, subjectName),
      configured: false,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const history = cleanHistory(messages);
    const subjectPrompt = subjectName ? `Materia seleccionada por el estudiante: ${subjectName}.` : null;
    const response = isAnthropic
      ? await fetch(`${baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            temperature: 0.4,
            max_tokens: maxTokens,
            system: subjectPrompt ? `${SYSTEM_PROMPT}\n\n${subjectPrompt}` : SYSTEM_PROMPT,
            messages: history,
          }),
          signal: controller.signal,
        })
      : await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.4,
            max_tokens: maxTokens,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...(subjectPrompt ? [{ role: 'system', content: subjectPrompt }] : []),
              ...history,
            ],
          }),
          signal: controller.signal,
        });

    if (!response.ok) {
      console.error('[campuscode] Error del proveedor de IA:', response.status);
      throw httpError(
        502,
        'El proveedor de inteligencia artificial no respondió correctamente. Intenta de nuevo en unos minutos.',
        'AI_UPSTREAM_ERROR',
      );
    }
    const data = await response.json();
    const content = isAnthropic
      ? Array.isArray(data?.content)
        ? data.content
            .filter((block) => block?.type === 'text' && typeof block.text === 'string')
            .map((block) => block.text)
            .join('\n\n')
        : ''
      : data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw httpError(502, 'La respuesta del proveedor de IA llegó vacía.', 'AI_EMPTY_RESPONSE');
    }
    return { provider, content, configured: true };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw httpError(504, 'El proveedor de IA tardó demasiado en responder.', 'AI_TIMEOUT');
    }
    if (error.status) throw error;
    console.error('[campuscode] Fallo de red al consultar IA:', error.message);
    throw httpError(502, 'No fue posible conectar con el proveedor de IA.', 'AI_NETWORK_ERROR');
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Guía local: NO es un modelo de IA. Es contenido determinista y educativo que
// permite recorrer la interfaz sin credenciales, siempre identificado como tal.
// ---------------------------------------------------------------------------
function buildLocalGuide(messages, subjectName) {
  const last = [...messages].reverse().find((message) => message.role === 'user');
  const question = String(last?.content || '').toLowerCase();
  const intro =
    '**Guía local de estudio.** La IA no está conectada en este entorno. Te comparto una ruta de razonamiento preparada por el equipo de CampusCode; no es una respuesta generada por un modelo de lenguaje.';

  const blocks = [];

  if (/(recurs|factorial|pila de llamadas)/.test(question)) {
    blocks.push(
      '### Cómo pensar la recursión',
      'Una función recursiva resuelve un problema usando una versión más pequeña del mismo problema. Necesita dos piezas:',
      '1. **Caso base:** la condición que detiene la recursión.',
      '2. **Caso recursivo:** una llamada con una entrada que se acerca al caso base.',
      '```python\ndef factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)\n```',
      'Traza `factorial(3)` como una cadena: `3 * factorial(2)` → `2 * factorial(1)` → `1 * factorial(0)` → `1`. Luego las multiplicaciones se resuelven de regreso: 1, 1, 2, 6.',
      '**Para practicar:** escribe la traza de `factorial(4)` y explica en una frase qué evita el caso base.',
    );
  } else if (/(derivad|limite|límite|calculo|cálculo)/.test(question)) {
    blocks.push(
      '### Ruta para resolver un límite o una derivada',
      '1. Identifica si hay una indeterminación al sustituir (por ejemplo 0/0).',
      '2. Antes de derivar, simplifica o factoriza cuando sea posible.',
      '3. Aplica la regla correspondiente y conserva el orden de las operaciones.',
      '4. Verifica el resultado con una sustitución o una gráfica.',
      'Ejemplo: `(x² − 4)/(x − 2)` se factoriza como `(x − 2)(x + 2)/(x − 2)`; al simplificar queda `x + 2`, y el límite en x = 2 es 4.',
      '**Para practicar:** resuelve `lim (x → 3) (x² − 9)/(x − 3)` e indica qué factor se cancela.',
    );
  } else if (/(sql|base de datos|consulta|join|group by)/.test(question)) {
    blocks.push(
      '### Orden mental de una consulta SQL',
      '1. `SELECT`: qué columnas necesitas.',
      '2. `FROM` y `JOIN`: de dónde vienen los datos y cómo se relacionan.',
      '3. `WHERE`: filtra filas antes de agrupar.',
      '4. `GROUP BY` y `HAVING`: agrupa y filtra grupos.',
      '5. `ORDER BY` y `LIMIT`: ordena y recorta el resultado.',
      '```sql\nSELECT programa, COUNT(*) AS total\nFROM inscritos\nGROUP BY programa\nHAVING COUNT(*) > 5;\n```',
      '**Para practicar:** explica la diferencia entre `WHERE` y `HAVING` usando esta consulta.',
    );
  } else if (/(newton|fuerza|aceleraci|fisica|física)/.test(question)) {
    blocks.push(
      '### Segunda ley de Newton sin atajos',
      'La relación es `F = m · a`. Antes de despejar, dibuja un diagrama de cuerpo libre y define el sistema de referencia.',
      '1. Identifica todas las fuerzas y su dirección.',
      '2. Suma las fuerzas en cada eje.',
      '3. Despeja la incógnita y revisa las unidades: `N = kg · m/s²`.',
      'Ejemplo: 30 N sobre 6 kg → `a = 30 / 6 = 5 m/s²`.',
      '**Para practicar:** si la masa se duplica y la fuerza neta no cambia, ¿qué ocurre con la aceleración?',
    );
  } else if (/(probabilidad|media|mediana|estadistica|estadística)/.test(question)) {
    blocks.push(
      '### Antes de calcular una medida estadística',
      '1. Distingue si trabajas con una población o una muestra.',
      '2. Ordena los datos para la mediana y revisa si hay valores atípicos.',
      '3. La media es sensible a los extremos; la mediana no.',
      '4. En probabilidad clásica, verifica que los resultados sean equiprobables.',
      'Ejemplo: para el conjunto 4, 6, 6, 8, 10 la media es `34 / 5 = 6,8`; la mediana y la moda son 6.',
      '**Para practicar:** agrega el valor 30 al conjunto y compara cómo cambian media y mediana.',
    );
  } else if (/(tutela|constitucion|constitución|derecho|norma|juridic|jurídic)/.test(question)) {
    blocks.push(
      '### Cómo estudiar un problema jurídico',
      '1. Identifica el hecho relevante y el derecho involucrado.',
      '2. Distingue reglas constitucionales, legales y jurisprudenciales.',
      '3. Revisa la vigencia y el ámbito de aplicación de la norma.',
      '4. Construye la argumentación con premisas explícitas y una conclusión.',
      'La acción de tutela protege derechos fundamentales de forma subsidiaria y sumaria (artículo 86 de la Constitución de 1991).',
      'Esta guía es educativa y no sustituye asesoría jurídica profesional.',
      '**Para practicar:** identifica en un caso hipotético si existe otro medio de protección antes de acudir a la tutela.',
    );
  } else if (/(enzima|glucolisis|glucólisis|atp|metabolismo)/.test(question)) {
    blocks.push(
      '### Enzimas y energía',
      'Las enzimas reducen la energía de activación estabilizando el estado de transición. No cambian el ΔG global ni la constante de equilibrio.',
      'En la glucólisis, la inversión inicial es de 2 ATP y la fase de beneficio produce 4 ATP, para un balance neto de 2 ATP y 2 NADH por glucosa.',
      '**Para practicar:** explica por qué una enzima no puede hacer espontánea una reacción con ΔG positivo.',
    );
  } else if (/(costo|presupuesto|contabilidad|patrimonio|finanz|finanz)/.test(question)) {
    blocks.push(
      '### Orden para un ejercicio financiero',
      '1. Escribe los datos y las unidades.',
      '2. Distingue costos fijos de variables, o activo de pasivo.',
      '3. Plantea la ecuación antes de calcular.',
      '4. Verifica que el resultado tenga sentido económico.',
      'Ejemplo contable: `Activo = Pasivo + Patrimonio`; si activo = 500.000 y pasivo = 200.000, patrimonio = 300.000.',
      '**Para practicar:** calcula el costo total con 60 unidades si los costos fijos son 500.000 y el variable unitario es 15.000.',
    );
  } else {
    const subjectLine = subjectName ? ` para **${subjectName}**` : '';
    blocks.push(
      `### Ruta de estudio${subjectLine}`,
      'No tengo un modelo de IA conectado, pero puedo darte un método para abordar la duda:',
      '1. **Formula la pregunta:** escribe qué sabes, qué necesitas encontrar y qué restricciones tienes.',
      '2. **Busca un ejemplo resuelto:** identifica cada paso y justifica por qué se aplica.',
      '3. **Resuelve un caso parecido:** cambia un dato y compara el procedimiento.',
      '4. **Explica el resultado en voz alta:** si no puedes justificarlo, vuelve al paso que falta.',
      'Si compartes el enunciado completo y el intento que llevas, podré darte una guía más específica con la biblioteca de ejercicios.',
    );
  }

  blocks.push(
    '### Siguiente paso en CampusCode',
    'Abre el banco de ejercicios y filtra por esta materia. Intenta resolver sin mirar la solución y usa la pista solo después de un primer intento.',
  );

  return `${intro}\n\n${blocks.join('\n\n')}`;
}
