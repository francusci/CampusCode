import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const now = new Date();
const iso = (date) => date.toISOString().slice(0, 19).replace('T', ' ');
const daysAgo = (n) => {
  const date = new Date(now);
  date.setDate(date.getDate() - n);
  return iso(date);
};
const day = (n) => daysAgo(n).slice(0, 10);
const dayAt = (n, hour, minute = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() - n);
  date.setHours(hour, minute, 0, 0);
  return iso(date);
};

const catalog = [
  {
    career: {
      id: 'car-ing-informatica',
      slug: 'ing-informatica',
      name: 'Ingeniería Informática',
      faculty: 'Facultad de Ingeniería',
      description: 'Lógica, software, datos y sistemas para construir soluciones tecnológicas.',
      icon: 'Code',
      color: 'blue',
    },
    subjects: [
      {
        id: 'sub-prog1',
        slug: 'programacion-i',
        name: 'Programación I',
        description: 'Fundamentos de algoritmos, variables, condicionales, ciclos y funciones con Python.',
        semester: 1,
        credits: 4,
        topics: [
          {
            id: 'top-prog-fundamentos',
            slug: 'fundamentos-python',
            name: 'Fundamentos y expresiones',
            description: 'Variables, tipos de datos, operadores y orden de evaluación.',
            exercises: [
              {
                id: 'ex-prog-output',
                title: '¿Qué imprime este bloque de Python?',
                statement:
                  'Analiza el siguiente código y escribe únicamente el valor que se imprime.\n\n```python\na = 5\nb = 2\na = a * b + 5\nprint(a)\n```',
                difficulty: 'basico',
                type: 'abierta',
                answer: '15',
                hint: 'Primero se resuelve la multiplicación y después la suma. El nuevo valor reemplaza a la variable a.',
                procedure: [
                  'Se asignan los valores iniciales: a = 5 y b = 2.',
                  'La expresión a * b + 5 se evalúa como (5 * 2) + 5.',
                  'El resultado, 15, se guarda nuevamente en a.',
                  'print(a) muestra 15 en la consola.',
                ],
                explanation:
                  'En Python la asignación se evalúa de derecha a izquierda y la multiplicación tiene mayor precedencia que la suma. Por eso el resultado es 15 y no 20.',
                tags: ['python', 'variables', 'operadores'],
                published_at: day(18),
              },
              {
                id: 'ex-prog-clasifica',
                title: 'Clasificación de un número',
                statement:
                  'Un programa recibe el número -7. ¿Qué categoría imprime el siguiente condicional?\n\n```python\nif numero > 0:\n    print("Positivo")\nelif numero < 0:\n    print("Negativo")\nelse:\n    print("Cero")\n```',
                difficulty: 'basico',
                type: 'multiple',
                options: ['Positivo', 'Negativo', 'Cero', 'Error de ejecución'],
                answer: 'Negativo',
                hint: 'Compara -7 con 0. ¿Es mayor o menor?',
                procedure: [
                  'La primera condición (-7 > 0) es falsa.',
                  'La segunda condición (-7 < 0) es verdadera.',
                  'Se ejecuta la rama elif y se imprime "Negativo".',
                  'La rama else no se ejecuta.',
                ],
                explanation:
                  'Los condicionales evalúan las ramas en orden y se detienen en la primera que sea verdadera. Un número negativo siempre es menor que cero.',
                tags: ['python', 'condicionales'],
                published_at: day(17),
              },
            ],
          },
          {
            id: 'top-prog-bucles',
            slug: 'condicionales-y-bucles',
            name: 'Condicionales y bucles',
            description: 'Toma de decisiones, iteración y acumuladores.',
            exercises: [
              {
                id: 'ex-prog-doble',
                title: 'Escribe una función que duplique un número',
                statement:
                  'Escribe en Python una función llamada `doble` que reciba un número y retorne su doble. No necesitas imprimir el resultado.\n\nEjemplo: `doble(7)` debe retornar `14`.',
                difficulty: 'basico',
                type: 'codigo',
                answer: 'def doble(n):\n    return n * 2||def doble(n):\n    return n + n||def doble(n): return n*2',
                hint: 'Usa def, un parámetro llamado n y la instrucción return.',
                procedure: [
                  'Define la función con def doble(n):.',
                  'Dentro de la función, retorna n * 2.',
                  'No uses print: la función debe devolver el valor con return.',
                  'Prueba mentalmente con doble(7): 7 * 2 = 14.',
                ],
                explanation:
                  'Una función puede recibir datos, procesarlos y devolver un resultado. return entrega el valor a quien llama la función; print solo lo muestra en pantalla.',
                tags: ['python', 'funciones', 'return'],
                published_at: day(15),
              },
              {
                id: 'ex-prog-suma',
                title: 'Suma acumulada en un ciclo',
                statement:
                  '¿Cuál es el valor final de la variable suma?\n\n```python\nsuma = 0\nfor i in range(1, 5):\n    suma += i\n```',
                difficulty: 'basico',
                type: 'multiple',
                options: ['4', '10', '15', '14'],
                answer: '10',
                hint: 'range(1, 5) genera 1, 2, 3 y 4. El límite superior no se incluye.',
                procedure: [
                  'range(1, 5) produce los valores 1, 2, 3 y 4.',
                  'En cada iteración se suma el valor actual al acumulador.',
                  '1 + 2 + 3 + 4 = 10.',
                  'Al terminar el ciclo, suma vale 10.',
                ],
                explanation:
                  'Un acumulador debe inicializarse antes del ciclo. El límite superior de range no se incluye, un error frecuente al contar iteraciones.',
                tags: ['python', 'bucles', 'range'],
                published_at: day(16),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-ed',
        slug: 'estructuras-de-datos',
        name: 'Estructuras de Datos',
        description: 'Listas, pilas, colas, árboles y análisis de complejidad.',
        semester: 3,
        credits: 4,
        topics: [
          {
            id: 'top-ed-busqueda',
            slug: 'busqueda-y-complejidad',
            name: 'Búsqueda y complejidad',
            description: 'Búsqueda lineal, búsqueda binaria y notación asintótica.',
            exercises: [
              {
                id: 'ex-ed-busqueda',
                title: 'Complejidad de la búsqueda binaria',
                statement:
                  'En un arreglo ordenado de n elementos, la búsqueda binaria descarta la mitad del espacio de búsqueda en cada paso. ¿Cuál es su complejidad temporal en el peor caso?',
                difficulty: 'intermedio',
                type: 'multiple',
                options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
                answer: 'O(log n)',
                hint: 'Si en cada paso el problema se reduce a la mitad, el número de pasos crece con el logaritmo de n.',
                procedure: [
                  'Cada comparación descarta aproximadamente la mitad de los elementos restantes.',
                  'Después de k pasos quedan n / 2^k elementos por revisar.',
                  'El proceso termina cuando n / 2^k = 1, es decir, k = log2(n).',
                  'Por eso el peor caso es O(log n).',
                ],
                explanation:
                  'La búsqueda binaria solo puede aplicarse sobre datos ordenados. Su ventaja frente a la búsqueda lineal (O(n)) crece con el tamaño del arreglo.',
                tags: ['algoritmos', 'complejidad', 'búsqueda binaria'],
                published_at: day(14),
              },
            ],
          },
          {
            id: 'top-ed-arboles',
            slug: 'arboles-binarios',
            name: 'Árboles binarios',
            description: 'Raíz, hojas, altura y recorridos.',
            exercises: [
              {
                id: 'ex-ed-altura',
                title: 'Altura de un árbol binario',
                statement:
                  'Un árbol binario tiene una raíz, dos hijos de la raíz y cada uno de esos hijos tiene dos hojas. Si la altura se cuenta por el número de niveles (la raíz es el nivel 1), ¿cuál es su altura?',
                difficulty: 'intermedio',
                type: 'abierta',
                answer: '3|tres',
                hint: 'Dibuja el árbol: raíz, luego hijos y finalmente nietos.',
                procedure: [
                  'Nivel 1: la raíz.',
                  'Nivel 2: los dos hijos de la raíz.',
                  'Nivel 3: las cuatro hojas, dos por cada hijo.',
                  'El árbol tiene tres niveles, por lo tanto su altura es 3.',
                ],
                explanation:
                  'La altura mide la profundidad máxima desde la raíz hasta una hoja. Contar niveles es una convención; en otras definiciones la altura de un nodo hoja es 0. Siempre hay que indicar la convención usada.',
                tags: ['árboles', 'altura', 'estructuras'],
                published_at: day(12),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-bd',
        slug: 'bases-de-datos',
        name: 'Bases de Datos',
        description: 'Modelo relacional, normalización y consultas SQL.',
        semester: 4,
        credits: 4,
        topics: [
          {
            id: 'top-bd-modelo',
            slug: 'modelo-relacional',
            name: 'Modelo relacional',
            description: 'Tablas, claves, integridad y relaciones.',
            exercises: [
              {
                id: 'ex-bd-llave',
                title: 'Función de una clave foránea',
                statement:
                  'En una base de datos relacional, ¿cuál es la función principal de una clave foránea?',
                difficulty: 'basico',
                type: 'multiple',
                options: [
                  'Identificar de forma única cada fila de su propia tabla',
                  'Garantizar la integridad referencial entre dos tablas',
                  'Acelerar siempre las consultas de texto',
                  'Cifrar los datos sensibles de la tabla',
                ],
                answer: 'Garantizar la integridad referencial entre dos tablas',
                hint: 'La clave foránea apunta a una clave primaria de otra tabla.',
                procedure: [
                  'La clave primaria identifica cada fila de una tabla.',
                  'La clave foránea es una columna que referencia la clave primaria de otra tabla.',
                  'El motor de base de datos rechaza valores que no existan en la tabla referenciada.',
                  'Así se evita registrar relaciones con registros inexistentes.',
                ],
                explanation:
                  'La integridad referencial evita datos huérfanos. Un índice o el cifrado son mecanismos distintos y no forman parte de la definición de clave foránea.',
                tags: ['sql', 'claves', 'integridad'],
                published_at: day(15),
              },
            ],
          },
          {
            id: 'top-bd-sql',
            slug: 'consultas-sql',
            name: 'Consultas SQL',
            description: 'SELECT, WHERE, agregaciones y agrupaciones.',
            exercises: [
              {
                id: 'ex-bd-count',
                title: 'Resultado de un COUNT con filtro',
                statement:
                  'La tabla inscritos contiene 10 filas. Cinco tienen programa = "Ingeniería Informática", tres tienen programa = "Derecho" y dos tienen programa = "Administración". ¿Qué valor devuelve la siguiente consulta?\n\n```sql\nSELECT COUNT(*) FROM inscritos\nWHERE programa = \'Derecho\';\n```',
                difficulty: 'basico',
                type: 'abierta',
                answer: '3',
                hint: 'COUNT(*) cuenta las filas que cumplen la condición del WHERE.',
                procedure: [
                  'WHERE filtra únicamente las filas cuyo programa es Derecho.',
                  'Hay tres filas que cumplen la condición.',
                  'COUNT(*) cuenta esas tres filas.',
                  'El resultado es 3.',
                ],
                explanation:
                  'WHERE se aplica antes de la agregación. Si se quisiera contar por programa se usaría GROUP BY programa.',
                tags: ['sql', 'count', 'where'],
                published_at: day(11),
              },
              {
                id: 'ex-bd-group',
                title: 'Agrupar antes de contar',
                statement:
                  '¿Qué cláusula permite obtener el número de estudiantes por programa en una sola consulta?',
                difficulty: 'intermedio',
                type: 'multiple',
                options: ['ORDER BY programa', 'GROUP BY programa', 'DISTINCT programa', 'HAVING programa'],
                answer: 'GROUP BY programa',
                hint: 'Necesitas una fila de resultado por cada programa.',
                procedure: [
                  'SELECT programa, COUNT(*) FROM inscritos agrupa por programa.',
                  'GROUP BY forma un grupo por cada valor distinto de la columna.',
                  'COUNT(*) cuenta las filas dentro de cada grupo.',
                  'ORDER BY solo ordena; DISTINCT elimina duplicados; HAVING filtra grupos.',
                ],
                explanation:
                  'GROUP BY produce una fila por grupo. HAVING se usa después para filtrar esos grupos, por ejemplo HAVING COUNT(*) > 5.',
                tags: ['sql', 'group by', 'agregaciones'],
                published_at: day(9),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    career: {
      id: 'car-ingenierias',
      slug: 'ingenierias',
      name: 'Ingenierías',
      faculty: 'Facultad de Ingeniería',
      description: 'Cálculo, física y estadística aplicadas al diseño y la innovación.',
      icon: 'GearSix',
      color: 'cyan',
    },
    subjects: [
      {
        id: 'sub-calculo',
        slug: 'calculo-diferencial',
        name: 'Cálculo Diferencial',
        description: 'Límites, continuidad y derivadas con aplicaciones.',
        semester: 1,
        credits: 4,
        topics: [
          {
            id: 'top-calculo-limites',
            slug: 'limites',
            name: 'Límites',
            description: 'Límites laterales, indeterminaciones y continuidad.',
            exercises: [
              {
                id: 'ex-calculo-limite',
                title: 'Indeterminación 0/0',
                statement: 'Calcula el siguiente límite:\n\n```\nlim (x → 2)  (x² − 4) / (x − 2)\n```',
                difficulty: 'intermedio',
                type: 'abierta',
                answer: '4',
                hint: 'Factoriza el numerador como diferencia de cuadrados y simplifica antes de sustituir.',
                procedure: [
                  'Al sustituir x = 2 se obtiene 0/0, una indeterminación.',
                  'Se factoriza x² − 4 = (x − 2)(x + 2).',
                  'Se cancela el factor (x − 2) porque x ≠ 2 en el límite.',
                  'Queda lim (x → 2) (x + 2) = 4.',
                ],
                explanation:
                  'La indeterminación se resuelve con álgebra, no evaluando directamente. El límite existe aunque la función no esté definida en x = 2.',
                tags: ['límites', 'factorización', 'cálculo'],
                published_at: day(13),
              },
            ],
          },
          {
            id: 'top-calculo-derivadas',
            slug: 'derivadas',
            name: 'Derivadas',
            description: 'Reglas de derivación y evaluación de la derivada.',
            exercises: [
              {
                id: 'ex-calculo-derivada',
                title: 'Derivada evaluada en un punto',
                statement: 'Si f(x) = 3x² + 2x − 5, ¿cuánto vale f′(2)?',
                difficulty: 'intermedio',
                type: 'abierta',
                answer: '14',
                hint: 'Deriva término a término y luego sustituye x = 2 en la derivada.',
                procedure: [
                  'La derivada de 3x² es 6x.',
                  'La derivada de 2x es 2.',
                  'La derivada de −5 es 0.',
                  'f′(x) = 6x + 2; f′(2) = 12 + 2 = 14.',
                ],
                explanation:
                  'La derivada indica la pendiente de la recta tangente. Evaluarla en un punto da la tasa de cambio instantánea en ese punto.',
                tags: ['derivadas', 'reglas', 'evaluación'],
                published_at: day(10),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-fisica',
        slug: 'fisica-mecanica',
        name: 'Física Mecánica',
        description: 'Cinemática, leyes de Newton y conservación de la energía.',
        semester: 2,
        credits: 4,
        topics: [
          {
            id: 'top-fisica-cinematica',
            slug: 'cinematica',
            name: 'Cinemática',
            description: 'Velocidad, aceleración y movimiento uniforme.',
            exercises: [
              {
                id: 'ex-fisica-cinematica',
                title: 'Velocidad media en línea recta',
                statement:
                  'Un ciclista recorre 120 metros en 6 segundos manteniendo dirección constante. ¿Cuál es su velocidad media en m/s? Escribe solo el número.',
                difficulty: 'basico',
                type: 'abierta',
                answer: '20',
                hint: 'La velocidad media es el desplazamiento dividido entre el tiempo.',
                procedure: [
                  'Identifica los datos: desplazamiento = 120 m, tiempo = 6 s.',
                  'Aplica v = Δx / Δt.',
                  'v = 120 m / 6 s = 20 m/s.',
                  'Como la dirección es constante, la velocidad media coincide con la rapidez media.',
                ],
                explanation:
                  'La velocidad es una magnitud vectorial; en una trayectoria recta sin cambios de sentido su valor medio se calcula con el desplazamiento total.',
                tags: ['cinemática', 'velocidad', 'mru'],
                published_at: day(8),
              },
            ],
          },
          {
            id: 'top-fisica-newton',
            slug: 'leyes-de-newton',
            name: 'Leyes de Newton',
            description: 'Fuerza, masa, aceleración y diagramas de cuerpo libre.',
            exercises: [
              {
                id: 'ex-fisica-newton',
                title: 'Segunda ley de Newton',
                statement:
                  'Una fuerza neta de 30 N actúa sobre un cuerpo de 6 kg. ¿Cuál es la aceleración del cuerpo?',
                difficulty: 'basico',
                type: 'multiple',
                options: ['0,2 m/s²', '5 m/s²', '36 m/s²', '180 m/s²'],
                answer: '5 m/s²',
                hint: 'Despeja la aceleración de F = m · a.',
                procedure: [
                  'La segunda ley establece F = m · a.',
                  'Se despeja a = F / m.',
                  'a = 30 N / 6 kg.',
                  'a = 5 m/s².',
                ],
                explanation:
                  'El newton se define como kg·m/s². Por eso al dividir newtons entre kilogramos se obtienen unidades de aceleración.',
                tags: ['newton', 'fuerza', 'aceleración'],
                published_at: day(7),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-estadistica',
        slug: 'estadistica-aplicada',
        name: 'Estadística Aplicada',
        description: 'Medidas de tendencia central, dispersión y probabilidad.',
        semester: 4,
        credits: 3,
        topics: [
          {
            id: 'top-est-media',
            slug: 'medidas-de-tendencia',
            name: 'Medidas de tendencia central',
            description: 'Media, mediana y moda en conjuntos de datos.',
            exercises: [
              {
                id: 'ex-estadistica-media',
                title: 'Media aritmética de cinco datos',
                statement: 'Calcula la media aritmética del conjunto: 4, 6, 6, 8, 10.',
                difficulty: 'basico',
                type: 'abierta',
                answer: '6.8|6,8',
                hint: 'Suma todos los valores y divide entre la cantidad de datos.',
                procedure: [
                  'Suma: 4 + 6 + 6 + 8 + 10 = 34.',
                  'Hay cinco datos.',
                  'Media = 34 / 5 = 6,8.',
                ],
                explanation:
                  'La media es sensible a valores extremos. En este conjunto la mediana es 6 y la moda también es 6, lo que muestra que las tres medidas no siempre coinciden.',
                tags: ['media', 'estadística', 'tendencia central'],
                published_at: day(6),
              },
            ],
          },
          {
            id: 'top-est-probabilidad',
            slug: 'probabilidad',
            name: 'Probabilidad',
            description: 'Espacio muestral, eventos y probabilidad clásica.',
            exercises: [
              {
                id: 'ex-estadistica-dado',
                title: 'Probabilidad de un evento con un dado',
                statement:
                  'Se lanza un dado justo de seis caras. ¿Cuál es la probabilidad de obtener un número par?',
                difficulty: 'basico',
                type: 'multiple',
                options: ['1/6', '1/3', '1/2', '2/3'],
                answer: '1/2',
                hint: 'Los números pares del dado son 2, 4 y 6.',
                procedure: [
                  'El espacio muestral tiene 6 resultados equiprobables: 1, 2, 3, 4, 5, 6.',
                  'El evento favorable es {2, 4, 6}, con 3 resultados.',
                  'P = casos favorables / casos posibles = 3 / 6.',
                  'La probabilidad es 1/2.',
                ],
                explanation:
                  'La probabilidad clásica exige resultados equiprobables. Si el dado estuviera cargado, habría que estimar las probabilidades con frecuencias.',
                tags: ['probabilidad', 'dado', 'eventos'],
                published_at: day(5),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    career: {
      id: 'car-administracion',
      slug: 'administracion',
      name: 'Administración',
      faculty: 'Facultad de Ciencias Económicas y Administrativas',
      description: 'Estrategia, personas, procesos y decisiones para las organizaciones.',
      icon: 'Briefcase',
      color: 'amber',
    },
    subjects: [
      {
        id: 'sub-admin',
        slug: 'fundamentos-administracion',
        name: 'Fundamentos de Administración',
        description: 'Planeación, organización, dirección y control.',
        semester: 1,
        credits: 3,
        topics: [
          {
            id: 'top-admin-planeacion',
            slug: 'planeacion-estrategica',
            name: 'Planeación estratégica',
            description: 'Diagnóstico, objetivos y herramientas de análisis.',
            exercises: [
              {
                id: 'ex-admin-dofa',
                title: '¿Qué analiza la matriz DOFA?',
                statement:
                  'La matriz DOFA es una herramienta de diagnóstico organizacional. ¿Qué elementos relaciona?',
                difficulty: 'basico',
                type: 'multiple',
                options: [
                  'Demanda, oferta, finanzas y alianzas',
                  'Fortalezas, oportunidades, debilidades y amenazas',
                  'Dirección, organización, funciones y actividades',
                  'Diagnóstico, objetivos, formulación y evaluación',
                ],
                answer: 'Fortalezas, oportunidades, debilidades y amenazas',
                hint: 'Dos factores son internos y dos son externos.',
                procedure: [
                  'Fortalezas y debilidades son factores internos de la organización.',
                  'Oportunidades y amenazas provienen del entorno.',
                  'La matriz cruza los cuatro factores para orientar la estrategia.',
                  'Su utilidad depende de que el diagnóstico tenga evidencia y no solo opiniones.',
                ],
                explanation:
                  'DOFA es un insumo, no una estrategia terminada. Después del diagnóstico deben definirse objetivos y acciones medibles.',
                tags: ['dofa', 'estrategia', 'diagnóstico'],
                published_at: day(20),
              },
            ],
          },
          {
            id: 'top-admin-estructura',
            slug: 'estructura-organizacional',
            name: 'Estructura organizacional',
            description: 'Departamentalización, jerarquía y tramo de control.',
            exercises: [
              {
                id: 'ex-admin-tramo',
                title: 'Tramo de control',
                statement:
                  '¿Qué mide el tramo de control en una estructura organizacional?',
                difficulty: 'intermedio',
                type: 'multiple',
                options: [
                  'El presupuesto asignado a cada área',
                  'La cantidad de personas que reportan a un mismo jefe',
                  'El número total de empleados de la empresa',
                  'La cantidad de niveles en el organigrama',
                ],
                answer: 'La cantidad de personas que reportan a un mismo jefe',
                hint: 'También se conoce como span of control.',
                procedure: [
                  'El tramo de control se refiere a los subordinados directos de un cargo.',
                  'Un tramo amplio genera estructuras planas.',
                  'Un tramo estrecho produce más niveles jerárquicos.',
                  'No debe confundirse con la profundidad total del organigrama.',
                ],
                explanation:
                  'No existe un tramo ideal universal: depende de la complejidad de las tareas, la capacitación del equipo y la capacidad de supervisión.',
                tags: ['organización', 'jerarquía', 'control'],
                published_at: day(15),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-talento',
        slug: 'gestion-talento-humano',
        name: 'Gestión del Talento Humano',
        description: 'Reclutamiento, selección, clima y desarrollo de personas.',
        semester: 5,
        credits: 3,
        topics: [
          {
            id: 'top-talento-reclutamiento',
            slug: 'reclutamiento',
            name: 'Reclutamiento y selección',
            description: 'Fuentes de reclutamiento, perfiles y entrevistas.',
            exercises: [
              {
                id: 'ex-talento-fuente',
                title: 'Fuentes internas de reclutamiento',
                statement: '¿Cuál de las siguientes es una fuente interna de reclutamiento?',
                difficulty: 'basico',
                type: 'multiple',
                options: [
                  'Publicar la vacante en un portal de empleo',
                  'Promover a un colaborador de otra área',
                  'Contratar una agencia de headhunting',
                  'Asistir a una feria universitaria',
                ],
                answer: 'Promover a un colaborador de otra área',
                hint: 'Lo interno ocurre dentro de la propia organización.',
                procedure: [
                  'Las fuentes internas buscan candidatos que ya trabajan en la empresa.',
                  'La promoción o el traslado de un colaborador es un ejemplo típico.',
                  'Las ferias, portales y agencias son fuentes externas.',
                  'Cada fuente tiene costos y tiempos distintos.',
                ],
                explanation:
                  'El reclutamiento interno reduce tiempos y costos, pero puede dejar vacíos en otras áreas y limitar la entrada de nuevas perspectivas.',
                tags: ['reclutamiento', 'talento', 'selección'],
                published_at: day(14),
              },
            ],
          },
          {
            id: 'top-talento-clima',
            slug: 'clima-organizacional',
            name: 'Clima organizacional',
            description: 'Percepción del ambiente laboral y cultura.',
            exercises: [
              {
                id: 'ex-talento-clima',
                title: 'Clima organizacional',
                statement:
                  'Una encuesta de clima organizacional mide principalmente:',
                difficulty: 'intermedio',
                type: 'multiple',
                options: [
                  'El valor de mercado de la empresa',
                  'Las percepciones de las personas sobre su ambiente de trabajo',
                  'La cantidad de productos vendidos por trimestre',
                  'El cumplimiento tributario de la organización',
                ],
                answer: 'Las percepciones de las personas sobre su ambiente de trabajo',
                hint: 'El clima se construye con percepciones compartidas.',
                procedure: [
                  'El clima organizacional es la percepción colectiva del ambiente laboral.',
                  'Se relaciona con liderazgo, comunicación, reconocimiento y condiciones de trabajo.',
                  'No es un indicador financiero ni comercial.',
                  'Sus resultados deben interpretarse con cuidado por la confidencialidad.',
                ],
                explanation:
                  'El clima es distinto de la cultura: la cultura son los supuestos y prácticas arraigadas; el clima es la percepción más cambiante del día a día.',
                tags: ['clima', 'cultura', 'encuestas'],
                published_at: day(9),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-costos',
        slug: 'costos-y-presupuestos',
        name: 'Costos y Presupuestos',
        description: 'Costeo, punto de equilibrio y planeación financiera.',
        semester: 4,
        credits: 3,
        topics: [
          {
            id: 'top-costos-costeo',
            slug: 'costeo',
            name: 'Costeo',
            description: 'Costos fijos, variables y costo total.',
            exercises: [
              {
                id: 'ex-costos-total',
                title: 'Costo total de producción',
                statement:
                  'Una empresa tiene costos fijos de $500.000 y un costo variable de $15.000 por unidad. Si produce 40 unidades, ¿cuál es el costo total? Escribe el valor sin puntos ni símbolos.',
                difficulty: 'basico',
                type: 'abierta',
                answer: '1100000|1.100.000|$1.100.000',
                hint: 'Costo total = costos fijos + (costo variable unitario × unidades).',
                procedure: [
                  'Costo variable total = 15.000 × 40 = 600.000.',
                  'Costo total = costos fijos + costo variable total.',
                  'Costo total = 500.000 + 600.000.',
                  'El resultado es $1.100.000.',
                ],
                explanation:
                  'Separar costos fijos y variables permite calcular el punto de equilibrio y evaluar cómo cambia la rentabilidad con el volumen.',
                tags: ['costos', 'producción', 'punto de equilibrio'],
                published_at: day(8),
              },
            ],
          },
          {
            id: 'top-costos-presupuesto',
            slug: 'presupuesto',
            name: 'Presupuesto',
            description: 'Presupuesto maestro y centros de responsabilidad.',
            exercises: [
              {
                id: 'ex-costos-presupuesto',
                title: 'Punto de partida del presupuesto maestro',
                statement:
                  'En muchas empresas comerciales, el presupuesto maestro comienza con el presupuesto de:',
                difficulty: 'intermedio',
                type: 'multiple',
                options: ['Producción', 'Ventas', 'Compras de activos', 'Gastos de publicidad'],
                answer: 'Ventas',
                hint: 'Las demás áreas deben responder a cuánto se espera vender.',
                procedure: [
                  'El presupuesto de ventas proyecta ingresos y volumen.',
                  'Producción, compras y gastos se derivan de esa proyección.',
                  'Por eso suele ser el primer componente del presupuesto maestro.',
                  'En empresas sin fines comerciales el punto de partida puede variar.',
                ],
                explanation:
                  'El presupuesto maestro integra ventas, producción, compras, costos y estados financieros proyectados. Su calidad depende de supuestos realistas.',
                tags: ['presupuesto', 'ventas', 'planeación'],
                published_at: day(4),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    career: {
      id: 'car-derecho',
      slug: 'derecho',
      name: 'Derecho',
      faculty: 'Facultad de Ciencias Jurídicas',
      description: 'Normas, argumentación y protección de derechos en contextos reales.',
      icon: 'Scales',
      color: 'rose',
    },
    subjects: [
      {
        id: 'sub-const',
        slug: 'derecho-constitucional',
        name: 'Derecho Constitucional',
        description: 'Constitución de 1991, derechos fundamentales y garantías.',
        semester: 2,
        credits: 4,
        topics: [
          {
            id: 'top-const-derechos',
            slug: 'derechos-fundamentales',
            name: 'Derechos fundamentales',
            description: 'Núcleo esencial, titulares y mecanismos de protección.',
            exercises: [
              {
                id: 'ex-const-tutela',
                title: 'Propósito de la acción de tutela',
                statement:
                  '¿Cuál es el propósito principal de la acción de tutela en Colombia?',
                difficulty: 'basico',
                type: 'multiple',
                options: [
                  'Resolver conflictos laborales entre empleadores y trabajadores',
                  'Proteger de manera inmediata los derechos fundamentales',
                  'Declarar la inconstitucionalidad de una ley',
                  'Cobrar obligaciones económicas incumplidas',
                ],
                answer: 'Proteger de manera inmediata los derechos fundamentales',
                hint: 'Es un mecanismo subsidiario y sumario.',
                procedure: [
                  'La tutela está consagrada en el artículo 86 de la Constitución.',
                  'Procede cuando un derecho fundamental es amenazado o vulnerado.',
                  'Es subsidiaria: se usa cuando no existe otro medio idóneo de protección.',
                  'No reemplaza los procesos ordinarios ni declara inconstitucionalidad.',
                ],
                explanation:
                  'La tutela protege derechos fundamentales de forma sumaria. La constitucionalidad de las leyes se controla por otras vías, como la acción pública de inconstitucionalidad.',
                tags: ['tutela', 'constitución', 'derechos'],
                published_at: day(19),
              },
            ],
          },
          {
            id: 'top-const-tutela',
            slug: 'accion-de-tutela',
            name: 'Acción de tutela',
            description: 'Procedencia, legitimación y efectos.',
            exercises: [
              {
                id: 'ex-const-articulo',
                title: 'Artículo constitucional de la tutela',
                statement:
                  '¿En qué artículo de la Constitución Política de 1991 se consagra la acción de tutela? Escribe solo el número.',
                difficulty: 'intermedio',
                type: 'abierta',
                answer: '86',
                hint: 'Está ubicado en el capítulo de mecanismos de protección de los derechos.',
                procedure: [
                  'La Constitución dedica el capítulo 4 del título II a la protección de los derechos.',
                  'El artículo 86 regula la acción de tutela.',
                  'Allí se define su procedencia, el plazo de decisión y sus efectos.',
                ],
                explanation:
                  'La tutela también está desarrollada por el Decreto 2591 de 1991 y por la jurisprudencia constitucional. Este ejercicio es conceptual y no sustituye asesoría jurídica.',
                tags: ['tutela', 'constitución', 'artículo 86'],
                published_at: day(16),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-civil',
        slug: 'derecho-civil-personas',
        name: 'Derecho Civil: Personas',
        description: 'Persona, capacidad, domicilio y derechos de la personalidad.',
        semester: 3,
        credits: 4,
        topics: [
          {
            id: 'top-civil-personas',
            slug: 'personas-y-capacidad',
            name: 'Personas y capacidad',
            description: 'Persona natural, capacidad legal y representación.',
            exercises: [
              {
                id: 'ex-civil-capacidad',
                title: 'Capacidad legal',
                statement:
                  'En términos generales, la capacidad legal de una persona natural se refiere a:',
                difficulty: 'basico',
                type: 'multiple',
                options: [
                  'La posibilidad de ejercer derechos y contraer obligaciones por sí misma',
                  'El nivel educativo alcanzado por la persona',
                  'La cantidad de bienes que posee',
                  'La edad exacta al momento de nacer',
                ],
                answer: 'La posibilidad de ejercer derechos y contraer obligaciones por sí misma',
                hint: 'Distingue capacidad de goce y capacidad de ejercicio.',
                procedure: [
                  'La capacidad de goce es la aptitud para ser titular de derechos.',
                  'La capacidad de ejercicio permite actuar directamente sin representación.',
                  'Ambas son conceptos jurídicos, no miden patrimonio ni educación.',
                  'Existen restricciones legales para ciertas personas, como menores de edad no emancipados.',
                ],
                explanation:
                  'La capacidad es un concepto regulado por la ley y sujeto a excepciones. No debe confundirse con la solvencia económica ni con la mayoría de edad como único criterio.',
                tags: ['capacidad', 'persona', 'civil'],
                published_at: day(12),
              },
            ],
          },
          {
            id: 'top-civil-obligaciones',
            slug: 'obligaciones',
            name: 'Obligaciones',
            description: 'Fuentes, clases y efectos de las obligaciones.',
            exercises: [
              {
                id: 'ex-civil-obligacion',
                title: 'Obligación de dar',
                statement:
                  'Cuando una persona se compromete a entregar una cosa determinada a otra, la obligación se clasifica como:',
                difficulty: 'intermedio',
                type: 'multiple',
                options: ['Obligación de hacer', 'Obligación de dar', 'Obligación de no hacer', 'Obligación natural'],
                answer: 'Obligación de dar',
                hint: 'La prestación consiste en transferir o entregar algo.',
                procedure: [
                  'La prestación es el comportamiento debido por el deudor.',
                  'Si consiste en entregar una cosa, es una obligación de dar.',
                  'Si consiste en ejecutar una actividad, es de hacer.',
                  'Si consiste en abstenerse, es de no hacer.',
                ],
                explanation:
                  'Las obligaciones de dar pueden tener por objeto cosas ciertas o inciertas. Sus efectos y riesgos varían según el caso y la regulación aplicable.',
                tags: ['obligaciones', 'prestación', 'civil'],
                published_at: day(7),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-arg',
        slug: 'argumentacion-juridica',
        name: 'Argumentación Jurídica',
        description: 'Premisas, estructura argumentativa y falacias.',
        semester: 4,
        credits: 3,
        topics: [
          {
            id: 'top-arg-estructura',
            slug: 'estructura-del-argumento',
            name: 'Estructura del argumento',
            description: 'Premisas, conclusión y validez.',
            exercises: [
              {
                id: 'ex-arg-premisa',
                title: 'Identificación de premisas',
                statement:
                  'En un argumento, las premisas son:',
                difficulty: 'basico',
                type: 'multiple',
                options: [
                  'Las afirmaciones que se ofrecen como razones para apoyar una conclusión',
                  'La conclusión final del razonamiento',
                  'Las opiniones personales sin relación con el tema',
                  'Las normas que siempre son válidas',
                ],
                answer: 'Las afirmaciones que se ofrecen como razones para apoyar una conclusión',
                hint: 'Las premisas sostienen la conclusión.',
                procedure: [
                  'Un argumento tiene premisas y una conclusión.',
                  'Las premisas son razones o evidencia.',
                  'La conclusión es la afirmación que se pretende justificar.',
                  'Un argumento puede ser válido aunque sus premisas sean falsas.',
                ],
                explanation:
                  'Distinguir premisas y conclusión permite evaluar la validez formal y la solidez material de un argumento jurídico.',
                tags: ['argumentación', 'premisas', 'lógica'],
                published_at: day(6),
              },
            ],
          },
          {
            id: 'top-arg-falacias',
            slug: 'falacias',
            name: 'Falacias argumentativas',
            description: 'Ataques personales, generalizaciones y apelaciones.',
            exercises: [
              {
                id: 'ex-arg-falacia',
                title: 'Ataque a la persona',
                statement:
                  '“No deberías creer su propuesta porque es una persona desordenada”. ¿Qué falacia se comete?',
                difficulty: 'intermedio',
                type: 'multiple',
                options: [
                  'Falacia ad hominem',
                  'Falacia de falsa causa',
                  'Falacia de generalización apresurada',
                  'Falacia de apelación a la autoridad',
                ],
                answer: 'Falacia ad hominem',
                hint: 'Se ataca a quien argumenta en lugar de evaluar el argumento.',
                procedure: [
                  'La conclusión se rechaza por una característica personal del emisor.',
                  'No se analiza la evidencia ni la validez de la propuesta.',
                  'Ese desplazamiento del argumento a la persona es ad hominem.',
                  'La falacia puede ser válida para cuestionar credibilidad, pero no para refutar la propuesta.',
                ],
                explanation:
                  'Las falacias no siempre son errores evidentes: suelen parecer persuasivas. Identificarlas exige separar la calidad del argumento de la persona que lo presenta.',
                tags: ['falacias', 'ad hominem', 'argumentación'],
                published_at: day(3),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    career: {
      id: 'car-salud',
      slug: 'ciencias-salud',
      name: 'Ciencias de la Salud',
      faculty: 'Facultad de Ciencias de la Salud',
      description: 'Cuerpo humano, procesos biológicos y salud pública.',
      icon: 'Heartbeat',
      color: 'emerald',
    },
    subjects: [
      {
        id: 'sub-anato',
        slug: 'anatomia-fisiologia',
        name: 'Anatomía y Fisiología',
        description: 'Estructura y función de los sistemas del cuerpo humano.',
        semester: 2,
        credits: 4,
        topics: [
          {
            id: 'top-anato-cardio',
            slug: 'sistema-cardiovascular',
            name: 'Sistema cardiovascular',
            description: 'Corazón, circulación y grandes vasos.',
            exercises: [
              {
                id: 'ex-anato-corazon',
                title: 'Cavidad que impulsa la sangre a la aorta',
                statement:
                  '¿Qué cavidad del corazón bombea sangre oxigenada hacia la aorta?',
                difficulty: 'basico',
                type: 'multiple',
                options: ['Aurícula derecha', 'Ventrículo derecho', 'Aurícula izquierda', 'Ventrículo izquierdo'],
                answer: 'Ventrículo izquierdo',
                hint: 'La sangre oxigenada regresa por las venas pulmonares al lado izquierdo.',
                procedure: [
                  'La sangre oxigenada llega de los pulmones a la aurícula izquierda.',
                  'Pasa al ventrículo izquierdo.',
                  'El ventrículo izquierdo la impulsa a la aorta para la circulación sistémica.',
                  'Su pared es más gruesa porque debe generar mayor presión.',
                ],
                explanation:
                  'El circuito pulmonar trabaja a menor presión que el sistémico. Esa diferencia explica el grosor del miocardio en el ventrículo izquierdo.',
                tags: ['corazón', 'circulación', 'anatomía'],
                published_at: day(13),
              },
            ],
          },
          {
            id: 'top-anato-nervioso',
            slug: 'sistema-nervioso',
            name: 'Sistema nervioso',
            description: 'Neuronas, sinapsis y organización del sistema nervioso.',
            exercises: [
              {
                id: 'ex-anato-neurona',
                title: 'Recepción de señales en la neurona',
                statement:
                  '¿Cuál es la estructura de la neurona que recibe principalmente las señales de otras neuronas?',
                difficulty: 'basico',
                type: 'abierta',
                answer: 'dendritas|dendrita',
                hint: 'Son prolongaciones ramificadas que aumentan la superficie de recepción.',
                procedure: [
                  'La neurona tiene soma, dendritas y axón.',
                  'Las dendritas reciben los estímulos y los conducen hacia el soma.',
                  'El axón transmite el potencial de acción hacia otras células.',
                  'La comunicación ocurre en la sinapsis.',
                ],
                explanation:
                  'Las dendritas reciben señales y el axón las transmite. La mielina acelera la conducción del potencial de acción en muchos axones.',
                tags: ['neurona', 'dendritas', 'sinapsis'],
                published_at: day(10),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-bioq',
        slug: 'bioquimica',
        name: 'Bioquímica',
        description: 'Enzimas, metabolismo y biomoléculas.',
        semester: 3,
        credits: 4,
        topics: [
          {
            id: 'top-bioq-enzimas',
            slug: 'enzimas',
            name: 'Enzimas',
            description: 'Catálisis, especificidad y energía de activación.',
            exercises: [
              {
                id: 'ex-bioq-enzima',
                title: 'Efecto de una enzima sobre la energía de activación',
                statement:
                  '¿Cómo aceleran las enzimas una reacción bioquímica?',
                difficulty: 'basico',
                type: 'multiple',
                options: [
                  'Aumentando la temperatura de la célula',
                  'Disminuyendo la energía de activación',
                  'Cambiando el signo de la energía libre de la reacción',
                  'Consumiendo ATP en cada paso',
                ],
                answer: 'Disminuyendo la energía de activación',
                hint: 'Una enzima no cambia el equilibrio, cambia la barrera cinética.',
                procedure: [
                  'Toda reacción requiere superar una barrera energética.',
                  'La enzima estabiliza el estado de transición.',
                  'Así reduce la energía de activación.',
                  'No modifica la constante de equilibrio ni el ΔG global.',
                ],
                explanation:
                  'Las enzimas son catalizadores biológicos. Su especificidad depende de la forma del sitio activo y de interacciones químicas con el sustrato.',
                tags: ['enzimas', 'catálisis', 'energía'],
                published_at: day(8),
              },
            ],
          },
          {
            id: 'top-bioq-metabolismo',
            slug: 'metabolismo',
            name: 'Metabolismo',
            description: 'Glucólisis, respiración y balance energético.',
            exercises: [
              {
                id: 'ex-bioq-glucolisis',
                title: 'Balance neto de ATP en la glucólisis',
                statement:
                  'En condiciones estándar, ¿cuál es el balance neto de ATP producido en la glucólisis por una molécula de glucosa?',
                difficulty: 'intermedio',
                type: 'multiple',
                options: ['0 ATP', '2 ATP', '4 ATP', '32 ATP'],
                answer: '2 ATP',
                hint: 'Se consumen 2 ATP en la fase de inversión y se producen 4 en la fase de beneficio.',
                procedure: [
                  'La fase de inversión consume 2 ATP.',
                  'La fase de beneficio produce 4 ATP por sustrato.',
                  'El balance neto es 4 − 2 = 2 ATP.',
                  'También se generan 2 NADH por glucosa.',
                ],
                explanation:
                  'El rendimiento total de la respiración depende del transporte de electrones y de la lanzadera utilizada para ingresar el NADH a la mitocondria.',
                tags: ['glucólisis', 'atp', 'metabolismo'],
                published_at: day(5),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-salud',
        slug: 'salud-publica',
        name: 'Salud Pública',
        description: 'Determinantes sociales, epidemiología y promoción de la salud.',
        semester: 6,
        credits: 3,
        topics: [
          {
            id: 'top-salud-determinantes',
            slug: 'determinantes-sociales',
            name: 'Determinantes sociales',
            description: 'Condiciones sociales que influyen en la salud.',
            exercises: [
              {
                id: 'ex-salud-determinante',
                title: 'Determinantes sociales de la salud',
                statement:
                  '¿Cuál de los siguientes es un determinante social de la salud?',
                difficulty: 'basico',
                type: 'multiple',
                options: [
                  'El acceso a agua potable en el barrio',
                  'El grupo sanguíneo de una persona',
                  'La estatura de un individuo',
                  'El tipo de medicamento recetado',
                ],
                answer: 'El acceso a agua potable en el barrio',
                hint: 'Piensa en condiciones del entorno donde las personas nacen, viven y trabajan.',
                procedure: [
                  'Los determinantes sociales son condiciones del entorno social y físico.',
                  'El agua potable, la vivienda y el empleo son ejemplos.',
                  'El grupo sanguíneo y la estatura son factores biológicos individuales.',
                  'Los determinantes sociales explican desigualdades evitables en salud.',
                ],
                explanation:
                  'La salud pública busca actuar sobre las condiciones estructurales que producen inequidades, no solo sobre las consecuencias individuales.',
                tags: ['determinantes', 'salud pública', 'equidad'],
                published_at: day(4),
              },
            ],
          },
          {
            id: 'top-salud-epi',
            slug: 'epidemiologia',
            name: 'Epidemiología',
            description: 'Medidas de frecuencia, incidencia y prevalencia.',
            exercises: [
              {
                id: 'ex-salud-incidencia',
                title: 'Cálculo de incidencia',
                statement:
                  'En una población de 2.000 personas se detectan 40 casos nuevos de una enfermedad durante un año. ¿Cuál es la incidencia por 1.000 habitantes? Escribe solo el número.',
                difficulty: 'avanzado',
                type: 'abierta',
                answer: '20',
                hint: 'Incidencia = (casos nuevos / población) × 1.000.',
                procedure: [
                  'Casos nuevos = 40.',
                  'Población en riesgo = 2.000.',
                  'Tasa = (40 / 2.000) × 1.000.',
                  'Tasa = 0,02 × 1.000 = 20 casos por 1.000 habitantes.',
                ],
                explanation:
                  'La incidencia mide casos nuevos y requiere seguimiento en el tiempo. La prevalencia mide todos los casos existentes en un momento o periodo.',
                tags: ['incidencia', 'epidemiología', 'tasas'],
                published_at: day(2),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    career: {
      id: 'car-economicas',
      slug: 'ciencias-economicas',
      name: 'Ciencias Económicas',
      faculty: 'Facultad de Ciencias Económicas',
      description: 'Mercados, contabilidad y decisiones financieras.',
      icon: 'ChartLineUp',
      color: 'violet',
    },
    subjects: [
      {
        id: 'sub-micro',
        slug: 'microeconomia',
        name: 'Microeconomía',
        description: 'Oferta, demanda, elasticidad y estructura de mercados.',
        semester: 2,
        credits: 3,
        topics: [
          {
            id: 'top-micro-demanda',
            slug: 'oferta-y-demanda',
            name: 'Oferta y demanda',
            description: 'Equilibrio, desplazamientos y precio.',
            exercises: [
              {
                id: 'ex-micro-demanda',
                title: 'Ley de la demanda',
                statement:
                  'Según la ley de la demanda, si todo lo demás permanece constante, un aumento del precio de un bien normalmente provoca:',
                difficulty: 'basico',
                type: 'multiple',
                options: [
                  'Un aumento de la cantidad demandada',
                  'Una disminución de la cantidad demandada',
                  'Un desplazamiento de la curva de demanda hacia la derecha',
                  'Ningún cambio en la cantidad demandada',
                ],
                answer: 'Una disminución de la cantidad demandada',
                hint: 'Distingue un movimiento a lo largo de la curva de un desplazamiento de la curva.',
                procedure: [
                  'La ley de la demanda describe una relación inversa entre precio y cantidad demandada.',
                  'Un precio mayor reduce la cantidad demandada.',
                  'Ese cambio se representa como un movimiento a lo largo de la curva.',
                  'Un desplazamiento de la curva ocurre por otros factores, como el ingreso.',
                ],
                explanation:
                  'Los cambios en el precio propio generan movimientos sobre la curva. Los cambios en determinantes como ingresos, gustos o precios relacionados desplazan la curva.',
                tags: ['demanda', 'precio', 'microeconomía'],
                published_at: day(11),
              },
            ],
          },
          {
            id: 'top-micro-elasticidad',
            slug: 'elasticidad',
            name: 'Elasticidad',
            description: 'Sensibilidad de la demanda frente al precio.',
            exercises: [
              {
                id: 'ex-micro-elasticidad',
                title: 'Elasticidad precio de la demanda',
                statement:
                  'Si la cantidad demandada disminuye un 10 % cuando el precio aumenta un 5 %, ¿cuál es la elasticidad precio de la demanda en valor absoluto? Escribe solo el número.',
                difficulty: 'avanzado',
                type: 'abierta',
                answer: '2',
                hint: 'Elasticidad = variación porcentual de la cantidad / variación porcentual del precio.',
                procedure: [
                  'Variación porcentual de la cantidad = −10 %.',
                  'Variación porcentual del precio = +5 %.',
                  'Elasticidad = −10 % / 5 % = −2.',
                  'En valor absoluto, la elasticidad es 2 (demanda elástica).',
                ],
                explanation:
                  'Cuando el valor absoluto es mayor que 1, la demanda es elástica: los consumidores responden proporcionalmente más que el cambio en el precio.',
                tags: ['elasticidad', 'demanda', 'precio'],
                published_at: day(6),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-contab',
        slug: 'contabilidad-financiera',
        name: 'Contabilidad Financiera',
        description: 'Ecuación contable y estados financieros básicos.',
        semester: 1,
        credits: 3,
        topics: [
          {
            id: 'top-contab-ecuacion',
            slug: 'ecuacion-contable',
            name: 'Ecuación contable',
            description: 'Activo, pasivo y patrimonio.',
            exercises: [
              {
                id: 'ex-contab-ecuacion',
                title: 'Patrimonio en la ecuación contable',
                statement:
                  'Una empresa tiene activos por $500.000 y pasivos por $200.000. ¿Cuál es su patrimonio? Escribe el valor sin puntos ni símbolos.',
                difficulty: 'basico',
                type: 'abierta',
                answer: '300000|300.000',
                hint: 'Activo = Pasivo + Patrimonio.',
                procedure: [
                  'La ecuación contable es Activo = Pasivo + Patrimonio.',
                  'Se despeja Patrimonio = Activo − Pasivo.',
                  'Patrimonio = 500.000 − 200.000.',
                  'El patrimonio es $300.000.',
                ],
                explanation:
                  'La ecuación contable debe mantenerse después de cada registro. El patrimonio representa el aporte de los socios más los resultados acumulados.',
                tags: ['contabilidad', 'patrimonio', 'ecuación'],
                published_at: day(9),
              },
            ],
          },
          {
            id: 'top-contab-estados',
            slug: 'estados-financieros',
            name: 'Estados financieros',
            description: 'Estado de resultados y balance general.',
            exercises: [
              {
                id: 'ex-contab-estado',
                title: 'Estado que muestra la utilidad del periodo',
                statement:
                  '¿Cuál estado financiero muestra los ingresos, costos y gastos de un periodo para determinar la utilidad?',
                difficulty: 'basico',
                type: 'multiple',
                options: [
                  'Balance general',
                  'Estado de flujos de efectivo',
                  'Estado de resultados',
                  'Estado de cambios en el patrimonio',
                ],
                answer: 'Estado de resultados',
                hint: 'Relaciona ingresos menos costos y gastos.',
                procedure: [
                  'El estado de resultados cubre un periodo.',
                  'Presenta ingresos, costos y gastos.',
                  'La diferencia permite calcular la utilidad o pérdida.',
                  'El balance general muestra la situación en una fecha determinada.',
                ],
                explanation:
                  'El estado de resultados es acumulativo durante el periodo; el balance general es una fotografía en una fecha. Ambos se complementan.',
                tags: ['estados financieros', 'utilidad', 'ingresos'],
                published_at: day(5),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-finanzas',
        slug: 'finanzas-corporativas',
        name: 'Finanzas Corporativas',
        description: 'Valor del dinero en el tiempo, riesgo y decisiones de inversión.',
        semester: 6,
        credits: 3,
        topics: [
          {
            id: 'top-finanzas-vp',
            slug: 'valor-presente',
            name: 'Valor presente',
            description: 'Descuento de flujos y tasa de oportunidad.',
            exercises: [
              {
                id: 'ex-finanzas-vp',
                title: 'Valor presente de un flujo futuro',
                statement:
                  '¿Cuál es el valor presente de $1.100.000 que se recibirán dentro de un año, si la tasa de descuento es del 10 % anual? Escribe el valor sin puntos ni símbolos.',
                difficulty: 'intermedio',
                type: 'abierta',
                answer: '1000000|1.000.000',
                hint: 'VP = VF / (1 + i)^n.',
                procedure: [
                  'Valor futuro = 1.100.000.',
                  'Tasa = 10 % = 0,10; n = 1 año.',
                  'VP = 1.100.000 / (1 + 0,10)^1.',
                  'VP = 1.100.000 / 1,10 = 1.000.000.',
                ],
                explanation:
                  'El valor presente permite comparar flujos que ocurren en momentos distintos. Una tasa mayor reduce el valor presente de los flujos futuros.',
                tags: ['valor presente', 'descuento', 'finanzas'],
                published_at: day(4),
              },
            ],
          },
          {
            id: 'top-finanzas-riesgo',
            slug: 'riesgo',
            name: 'Riesgo y diversificación',
            description: 'Riesgo sistemático y no sistemático.',
            exercises: [
              {
                id: 'ex-finanzas-riesgo',
                title: 'Reducción del riesgo específico',
                statement:
                  '¿Qué estrategia ayuda principalmente a reducir el riesgo específico de una cartera de inversión?',
                difficulty: 'intermedio',
                type: 'multiple',
                options: [
                  'Concentrar todo el capital en una sola acción',
                  'Diversificar entre activos con baja correlación',
                  'Aumentar el plazo de todas las inversiones',
                  'Ignorar la volatilidad histórica',
                ],
                answer: 'Diversificar entre activos con baja correlación',
                hint: 'El riesgo específico se reduce al combinar activos que no se mueven igual.',
                procedure: [
                  'El riesgo total combina riesgo sistemático y específico.',
                  'El riesgo específico afecta a una empresa o sector.',
                  'Combinar activos poco correlacionados compensa movimientos.',
                  'El riesgo de mercado o sistemático no se elimina con diversificación.',
                ],
                explanation:
                  'La diversificación reduce el riesgo no sistemático, pero no protege frente a caídas generales del mercado. La correlación entre activos es clave.',
                tags: ['riesgo', 'diversificación', 'cartera'],
                published_at: day(3),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    career: {
      id: 'car-otras',
      slug: 'otras-carreras',
      name: 'Otras carreras universitarias',
      faculty: 'Áreas transversales',
      description: 'Competencias de investigación y herramientas digitales para cualquier programa.',
      icon: 'Compass',
      color: 'slate',
    },
    subjects: [
      {
        id: 'sub-metodo',
        slug: 'metodologia-investigacion',
        name: 'Metodología de la Investigación',
        description: 'Planteamiento del problema, métodos y recolección de datos.',
        semester: 3,
        credits: 3,
        topics: [
          {
            id: 'top-metodo-planteamiento',
            slug: 'planteamiento-del-problema',
            name: 'Planteamiento del problema',
            description: 'Pregunta, objetivos y justificación.',
            exercises: [
              {
                id: 'ex-metodo-pregunta',
                title: 'Característica de una pregunta de investigación',
                statement:
                  '¿Cuál de las siguientes es una pregunta de investigación bien formulada?',
                difficulty: 'intermedio',
                type: 'multiple',
                options: [
                  '¿La tecnología es buena?',
                  '¿Cómo influye el uso de plataformas digitales en la organización del estudio de estudiantes universitarios de Cartagena?',
                  '¿Qué opinan todos los estudiantes del mundo?',
                  '¿Sería interesante investigar algo sobre educación?',
                ],
                answer:
                  '¿Cómo influye el uso de plataformas digitales en la organización del estudio de estudiantes universitarios de Cartagena?',
                hint: 'Busca una pregunta delimitada, con población y relación observable.',
                procedure: [
                  'Una pregunta de investigación debe ser clara y delimitada.',
                  'Debe indicar población, contexto y relación o fenómeno.',
                  'También debe ser viable con los recursos disponibles.',
                  'La opción elegida cumple esos criterios; las demás son demasiado amplias o valorativas.',
                ],
                explanation:
                  'Una buena pregunta orienta objetivos, método y análisis. Las preguntas demasiado generales dificultan la recolección y la interpretación de datos.',
                tags: ['investigación', 'pregunta', 'método'],
                published_at: day(7),
              },
            ],
          },
          {
            id: 'top-metodo-recoleccion',
            slug: 'tecnicas-de-recoleccion',
            name: 'Técnicas de recolección',
            description: 'Encuestas, entrevistas y observación.',
            exercises: [
              {
                id: 'ex-metodo-encuesta',
                title: 'Técnica para medir opiniones en una muestra grande',
                statement:
                  'Para conocer la percepción de 500 estudiantes sobre un servicio, la técnica más adecuada entre las opciones es:',
                difficulty: 'basico',
                type: 'multiple',
                options: [
                  'Entrevista abierta a una sola persona',
                  'Encuesta con preguntas estandarizadas',
                  'Análisis de documentos históricos',
                  'Observación sin registro',
                ],
                answer: 'Encuesta con preguntas estandarizadas',
                hint: 'Se busca comparar respuestas de muchas personas.',
                procedure: [
                  'El objetivo es describir una percepción en una muestra amplia.',
                  'La encuesta estandariza preguntas y facilita el análisis agregado.',
                  'La entrevista abierta es útil para profundizar, no para 500 casos.',
                  'La observación sin registro no permite analizar respuestas.',
                ],
                explanation:
                  'La técnica debe corresponder al objetivo y al tamaño de la muestra. Una encuesta requiere un diseño de muestreo y un instrumento validado.',
                tags: ['encuesta', 'muestra', 'recolección'],
                published_at: day(2),
              },
            ],
          },
        ],
      },
      {
        id: 'sub-digital',
        slug: 'competencias-digitales',
        name: 'Competencias Digitales',
        description: 'Hojas de cálculo, ciudadanía digital y productividad.',
        semester: 1,
        credits: 2,
        topics: [
          {
            id: 'top-digital-hojas',
            slug: 'hojas-de-calculo',
            name: 'Hojas de cálculo',
            description: 'Fórmulas, referencias y funciones básicas.',
            exercises: [
              {
                id: 'ex-digital-suma',
                title: 'Función para sumar un rango',
                statement:
                  'En una hoja de cálculo, ¿qué función suma todos los valores del rango A1:A10?',
                difficulty: 'basico',
                type: 'multiple',
                options: ['=PROMEDIO(A1:A10)', '=SUMA(A1:A10)', '=CONTAR(A1:A10)', '=MAX(A1:A10)'],
                answer: '=SUMA(A1:A10)',
                hint: 'SUMA es el nombre de la función en español.',
                procedure: [
                  'El rango A1:A10 contiene diez celdas.',
                  'SUMA agrega los valores numéricos del rango.',
                  'PROMEDIO calcula la media; CONTAR cuenta; MAX devuelve el mayor.',
                  'La fórmula correcta es =SUMA(A1:A10).',
                ],
                explanation:
                  'Las fórmulas comienzan con el signo igual. Los rangos usan dos puntos para incluir todas las celdas entre los extremos.',
                tags: ['excel', 'fórmulas', 'hojas de cálculo'],
                published_at: day(6),
              },
            ],
          },
          {
            id: 'top-digital-ciudadania',
            slug: 'ciudadania-digital',
            name: 'Ciudadanía digital',
            description: 'Identidad, privacidad y huella digital.',
            exercises: [
              {
                id: 'ex-digital-huella',
                title: 'Huella digital',
                statement:
                  '¿Qué es la huella digital de una persona?',
                difficulty: 'basico',
                type: 'multiple',
                options: [
                  'El rastro de datos que dejan sus actividades en línea',
                  'El número de serie del computador que usa',
                  'La contraseña de su correo electrónico',
                  'La velocidad de su conexión a internet',
                ],
                answer: 'El rastro de datos que dejan sus actividades en línea',
                hint: 'Incluye publicaciones, búsquedas, compras y metadatos.',
                procedure: [
                  'Cada interacción en línea genera registros.',
                  'Esos registros forman un rastro que puede persistir.',
                  'La huella digital puede afectar reputación y privacidad.',
                  'Se gestiona con configuración de privacidad y hábitos conscientes.',
                ],
                explanation:
                  'La huella digital combina información que compartimos de forma voluntaria y datos generados automáticamente. No siempre es visible ni fácil de eliminar.',
                tags: ['privacidad', 'huella digital', 'ciudadanía'],
                published_at: day(1),
              },
            ],
          },
        ],
      },
    ],
  },
];

const companies = [
  {
    id: 'cmp-nexo',
    owner: 'usr-empresa-nexo',
    name: 'Nexo Logística',
    slug: 'nexo-logistica',
    sector: 'Logística y movilidad',
    description:
      'Empresa ficticia de distribución urbana usada para demostrar cómo se publican retos en CampusCode.',
    website: 'https://ejemplo.com/nexo-logistica',
    location: 'Cartagena, Colombia',
    logo_color: 'blue',
    verified: 1,
  },
  {
    id: 'cmp-aurora',
    owner: 'usr-empresa-aurora',
    name: 'Aurora Salud Digital',
    slug: 'aurora-salud-digital',
    sector: 'Salud y bienestar',
    description:
      'Organización ficticia de salud digital enfocada en seguimiento de pacientes crónicos.',
    website: 'https://ejemplo.com/aurora-salud',
    location: 'Barranquilla, Colombia',
    logo_color: 'emerald',
    verified: 0,
  },
  {
    id: 'cmp-caribe-legal',
    owner: 'usr-empresa-legal',
    name: 'Caribe Legal Tech',
    slug: 'caribe-legal-tech',
    sector: 'Servicios jurídicos',
    description:
      'Estudio jurídico ficticio que explora herramientas digitales para investigación y acceso a la justicia.',
    website: 'https://ejemplo.com/caribe-legal',
    location: 'Cartagena, Colombia',
    logo_color: 'rose',
    verified: 0,
  },
  {
    id: 'cmp-pacifico',
    owner: 'usr-empresa-pacifico',
    name: 'Pacífico Finanzas',
    slug: 'pacifico-finanzas',
    sector: 'Servicios financieros',
    description:
      'Entidad ficticia de educación financiera y productos de ahorro para jóvenes.',
    website: 'https://ejemplo.com/pacifico-finanzas',
    location: 'Bogotá, Colombia',
    logo_color: 'violet',
    verified: 0,
  },
  {
    id: 'cmp-ecocaribe',
    owner: 'usr-empresa-eco',
    name: 'EcoCaribe Energía',
    slug: 'ecocaribe-energia',
    sector: 'Energía y sostenibilidad',
    description:
      'Compañía ficticia de energía renovable y medición de huella de carbono.',
    website: 'https://ejemplo.com/ecocaribe',
    location: 'Cartagena, Colombia',
    logo_color: 'amber',
    verified: 0,
  },
];

const challenges = [
  {
    id: 'cha-ultima-milla',
    company: 'cmp-nexo',
    title: 'Optimiza la última milla en Cartagena',
    slug: 'optimiza-ultima-milla-cartagena',
    summary:
      'Diseña una propuesta para reducir tiempos de entrega en zonas de alta congestión sin aumentar el costo operativo.',
    description:
      'Nexo Logística (empresa ficticia) quiere explorar cómo estudiantes de distintas carreras resolverían un problema de distribución urbana. El reto es analizar un conjunto de datos de ejemplo y proponer una estrategia de ruteo y priorización.',
    problem:
      'Las entregas en el centro de Cartagena presentan demoras por congestión, restricciones vehiculares y ventanas horarias limitadas. La operación actual asigna rutas por proximidad geográfica sin considerar la variabilidad del tráfico.',
    skills: ['SQL', 'Análisis de datos', 'Logística', 'Visualización'],
    category: 'Operaciones',
    published_at: day(12),
    deadline: '2026-12-15',
    deliverables:
      'Un documento de 4 a 6 páginas con el diagnóstico, la propuesta de ruteo, los supuestos y una visualización de los resultados. Datos y código en un repositorio o archivo comprimido.',
    requirements:
      'Estar inscrito en CampusCode como estudiante. Puede participar cualquier carrera. Se valoran el pensamiento analítico y la claridad para comunicar supuestos.',
    status: 'open',
    featured: 1,
  },
  {
    id: 'cha-hipertension',
    company: 'cmp-aurora',
    title: 'Panel para seguimiento de hipertensión',
    slug: 'panel-seguimiento-hipertension',
    summary:
      'Prototipa una vista clara para que pacientes y cuidadores registren presión arterial y detecten señales de alerta.',
    description:
      'Aurora Salud Digital (empresa ficticia) busca un prototipo de interfaz que ayude a registrar mediciones y comprender su evolución. No se usan datos reales de pacientes: el ejercicio trabaja con datos sintéticos.',
    problem:
      'Los registros de presión arterial suelen quedar dispersos y son difíciles de interpretar para personas sin formación clínica. La interfaz debe informar sin diagnosticar ni sustituir atención médica.',
    skills: ['React', 'Diseño UX', 'Accesibilidad', 'Datos sintéticos'],
    category: 'Salud digital',
    published_at: day(9),
    deadline: '2026-11-30',
    deliverables:
      'Prototipo navegable o repositorio con la interfaz, una breve explicación de decisiones de diseño y una nota visible sobre los límites médicos del prototipo.',
    requirements:
      'Estudiantes de Ingeniería, Diseño o áreas afines. No se requiere experiencia clínica. Se debe declarar el uso de datos sintéticos.',
    status: 'open',
    featured: 1,
  },
  {
    id: 'cha-jurisprudencia',
    company: 'cmp-caribe-legal',
    title: 'Buscador de jurisprudencia con lenguaje natural',
    slug: 'buscador-jurisprudencia-lenguaje-natural',
    summary:
      'Propón un flujo de búsqueda que permita encontrar providencias relevantes a partir de una consulta en lenguaje cotidiano.',
    description:
      'Caribe Legal Tech (empresa ficticia) quiere prototipar un buscador conceptual sobre un corpus público de ejemplo. El reto evalúa la formulación de consultas, la evaluación de resultados y la trazabilidad de las fuentes.',
    problem:
      'Las búsquedas jurídicas exigen términos técnicos y conocimiento previo. Personas sin formación jurídica abandonan la consulta o encuentran providencias poco pertinentes.',
    skills: ['Python', 'Procesamiento de lenguaje', 'Investigación', 'Ética'],
    category: 'Legal tech',
    published_at: day(7),
    deadline: '2026-12-05',
    deliverables:
      'Propuesta técnica y prototipo mínimo con 10 consultas de prueba, criterios de evaluación y advertencias sobre límites de la herramienta.',
    requirements:
      'Estudiantes de Derecho, Ingeniería o Ciencias de Datos. Toda fuente debe citarse. No se permite presentar el prototipo como asesoría jurídica.',
    status: 'open',
    featured: 0,
  },
  {
    id: 'cha-educacion-financiera',
    company: 'cmp-pacifico',
    title: 'Educación financiera para jóvenes universitarios',
    slug: 'educacion-financiera-jovenes',
    summary:
      'Crea una campaña o experiencia breve que ayude a estudiantes a entender el costo real de una compra a cuotas.',
    description:
      'Pacífico Finanzas (empresa ficticia) busca comunicar conceptos de interés compuesto y endeudamiento sin promover productos financieros. El enfoque debe ser educativo y comprensible.',
    problem:
      'Muchos estudiantes conocen la cuota mensual de una compra, pero no el costo total ni la tasa efectiva. La información suele estar fragmentada en condiciones poco legibles.',
    skills: ['Comunicación', 'Diseño', 'Educación financiera', 'Storytelling'],
    category: 'Finanzas',
    published_at: day(6),
    deadline: '2026-11-20',
    deliverables:
      'Pieza de comunicación o miniapp educativa, cálculo de un ejemplo real con tasas ficticias y una explicación de los supuestos usados.',
    requirements:
      'Abierto a todas las carreras. El contenido no debe recomendar productos de inversión ni prometer rendimientos.',
    status: 'open',
    featured: 0,
  },
  {
    id: 'cha-huella-carbono',
    company: 'cmp-ecocaribe',
    title: 'Medición de huella de carbono en el campus',
    slug: 'medicion-huella-carbono-campus',
    summary:
      'Diseña una metodología simple para estimar emisiones de un campus universitario con datos disponibles.',
    description:
      'EcoCaribe Energía (empresa ficticia) propone un ejercicio de estimación con datos abiertos y supuestos explícitos. El objetivo es aprender a medir, no certificar emisiones.',
    problem:
      'No existe un inventario consolidado de consumo eléctrico, transporte y residuos en el campus. Sin datos claros es difícil priorizar acciones de reducción.',
    skills: ['Excel', 'Análisis', 'Sostenibilidad', 'Comunicación'],
    category: 'Sostenibilidad',
    published_at: day(4),
    deadline: '2026-12-20',
    deliverables:
      'Hoja de cálculo con factores de emisión citados, un tablero de resultados y una lista de tres acciones priorizadas.',
    requirements:
      'Abierto a todas las carreras. Se deben citar las fuentes de los factores de emisión y declarar los supuestos.',
    status: 'open',
    featured: 0,
  },
  {
    id: 'cha-inventario',
    company: 'cmp-nexo',
    title: 'Trazabilidad de inventario en bodega',
    slug: 'trazabilidad-inventario-bodega',
    summary:
      'Reto cerrado de ejemplo sobre registro y seguimiento de movimientos de inventario.',
    description:
      'Este reto de ejemplo ya cerró. Se conserva para mostrar el historial de desafíos y el estado cerrado en el portal.',
    problem:
      'Los movimientos de inventario se registraban en hojas separadas y no permitían reconstruir la trazabilidad de un lote.',
    skills: ['Bases de datos', 'Procesos', 'Documentación'],
    category: 'Operaciones',
    published_at: day(45),
    deadline: '2026-09-30',
    deliverables:
      'Modelo de datos, diagrama de flujo y propuesta de controles.',
    requirements:
      'Reto cerrado. No acepta nuevas postulaciones.',
    status: 'closed',
    featured: 0,
  },
  {
    id: 'cha-borrador',
    company: 'cmp-nexo',
    title: 'Borrador: indicadores de satisfacción',
    slug: 'borrador-indicadores-satisfaccion',
    summary:
      'Borrador privado de ejemplo para demostrar la gestión de retos en el panel empresarial.',
    description:
      'Este reto está en borrador y solo es visible para la empresa propietaria y el equipo administrador.',
    problem:
      'La empresa todavía está definiendo el alcance del reto y los entregables.',
    skills: ['Análisis', 'Encuestas'],
    category: 'Operaciones',
    published_at: day(1),
    deadline: '2027-01-30',
    deliverables: 'Por definir.',
    requirements: 'Por definir.',
    status: 'draft',
    featured: 0,
  },
];

// Equipos del campus. Los estados son de demostración y se mantienen
// coherentes con los préstamos activos definidos más abajo.
const computers = [
  { id: 'pc-101-01', room: 'Sala 101', number: 'PC-01', condition: 'excelente', status: 'available', notes: 'Equipo de uso general.' },
  { id: 'pc-101-02', room: 'Sala 101', number: 'PC-02', condition: 'bueno', status: 'available', notes: 'Equipo de uso general.' },
  { id: 'pc-101-03', room: 'Sala 101', number: 'PC-03', condition: 'bueno', status: 'available', notes: 'Equipo de uso general.' },
  { id: 'pc-101-04', room: 'Sala 101', number: 'PC-04', condition: 'excelente', status: 'available', notes: 'Equipo de uso general.' },
  { id: 'pc-102-05', room: 'Sala 102', number: 'PC-05', condition: 'bueno', status: 'in_use', notes: 'Préstamo activo de demostración.' },
  { id: 'pc-102-06', room: 'Sala 102', number: 'PC-06', condition: 'excelente', status: 'available', notes: 'Equipo para práctica de software.' },
  { id: 'pc-102-07', room: 'Sala 102', number: 'PC-07', condition: 'bueno', status: 'available', notes: 'Equipo para práctica de software.' },
  { id: 'pc-102-08', room: 'Sala 102', number: 'PC-08', condition: 'con_detalles', status: 'available', notes: 'Teclado con desgaste leve.' },
  { id: 'pc-103-09', room: 'Sala 103', number: 'PC-09', condition: 'excelente', status: 'available', notes: 'Equipo de laboratorio.' },
  { id: 'pc-103-10', room: 'Sala 103', number: 'PC-10', condition: 'mantenimiento', status: 'maintenance', notes: 'En mantenimiento preventivo.' },
  { id: 'pc-103-11', room: 'Sala 103', number: 'PC-11', condition: 'bueno', status: 'available', notes: 'Equipo de laboratorio.' },
  { id: 'pc-103-12', room: 'Sala 103', number: 'PC-12', condition: 'excelente', status: 'available', notes: 'Equipo de laboratorio.' },
];

const computerLoans = [
  {
    id: 'loan-demo-active',
    user: 'usr-ana',
    computer: 'pc-102-05',
    room: 'Sala 102',
    number: 'PC-05',
    entry_at: dayAt(0, 8, 15),
    exit_at: null,
    condition: 'bueno',
    status: 'active',
    notes: 'Préstamo de demostración para práctica de programación.',
  },
  {
    id: 'loan-demo-1',
    user: 'usr-ana',
    computer: 'pc-101-01',
    room: 'Sala 101',
    number: 'PC-01',
    entry_at: dayAt(3, 9, 0),
    exit_at: dayAt(3, 11, 15),
    condition: 'excelente',
    status: 'returned',
    notes: null,
  },
  {
    id: 'loan-demo-2',
    user: 'usr-ana',
    computer: 'pc-101-02',
    room: 'Sala 101',
    number: 'PC-02',
    entry_at: dayAt(5, 14, 0),
    exit_at: dayAt(5, 16, 30),
    condition: 'bueno',
    status: 'returned',
    notes: null,
  },
  {
    id: 'loan-demo-3',
    user: 'usr-ana',
    computer: 'pc-103-09',
    room: 'Sala 103',
    number: 'PC-09',
    entry_at: dayAt(8, 10, 0),
    exit_at: dayAt(8, 12, 0),
    condition: 'excelente',
    status: 'returned',
    notes: null,
  },
];

const vacancies = [
  {
    id: 'vac-nexo-datos',
    company: 'cmp-nexo',
    title: 'Analista de datos junior',
    slug: 'analista-datos-junior-nexo',
    type: 'junior',
    description:
      'Vacante ficticia para demostrar el portal de reclutamiento. Buscamos una persona junior para apoyar el análisis de operaciones de distribución urbana, construir consultas y comunicar hallazgos con claridad.',
    requirements:
      'Estudiantes de últimos semestres o recién graduados en Ingeniería, Estadística o áreas afines. Manejo básico de SQL y hojas de cálculo. Interés por la logística y la visualización de datos.',
    location: 'Cartagena, Colombia',
    modality: 'hibrido',
    salary_range: '$2.800.000 - $3.600.000',
    deadline: '2026-12-15',
    status: 'open',
  },
  {
    id: 'vac-nexo-practica',
    company: 'cmp-nexo',
    title: 'Practicante de operaciones',
    slug: 'practicante-operaciones-nexo',
    type: 'practica',
    description:
      'Práctica ficticia de demostración para acompañar el seguimiento de rutas, documentar procesos y apoyar la preparación de reportes operativos.',
    requirements:
      'Estudiantes de Ingeniería Industrial, Administración o carreras afines. Excel intermedio, organización y comunicación escrita.',
    location: 'Cartagena, Colombia',
    modality: 'presencial',
    salary_range: 'Auxilio de práctica',
    deadline: '2026-11-30',
    status: 'open',
  },
  {
    id: 'vac-nexo-borrador',
    company: 'cmp-nexo',
    title: 'Borrador: coordinador de innovación',
    slug: 'borrador-coordinador-innovacion-nexo',
    type: 'empleo',
    description:
      'Borrador privado de demostración. Solo es visible para la empresa propietaria y el equipo administrador.',
    requirements:
      'Descripción pendiente de definir por la empresa.',
    location: 'Cartagena, Colombia',
    modality: 'hibrido',
    salary_range: null,
    deadline: '2027-01-30',
    status: 'draft',
  },
  {
    id: 'vac-aurora-frontend',
    company: 'cmp-aurora',
    title: 'Desarrollador frontend junior',
    slug: 'desarrollador-frontend-junior-aurora',
    type: 'junior',
    description:
      'Vacante ficticia para construir interfaces accesibles de seguimiento de pacientes. El equipo trabaja con React, TypeScript y diseño centrado en las personas.',
    requirements:
      'Conocimientos de HTML, CSS y JavaScript. Deseable experiencia con React y TypeScript. Interés por accesibilidad y salud digital.',
    location: 'Barranquilla, Colombia',
    modality: 'remoto',
    salary_range: '$3.200.000 - $4.200.000',
    deadline: '2026-12-10',
    status: 'open',
  },
  {
    id: 'vac-legal-practica',
    company: 'cmp-caribe-legal',
    title: 'Practicante de legal tech',
    slug: 'practicante-legal-tech-caribe',
    type: 'practica',
    description:
      'Práctica ficticia para investigar fuentes jurídicas públicas, documentar criterios de búsqueda y apoyar el diseño de un buscador de jurisprudencia.',
    requirements:
      'Estudiantes de Derecho o Ciencias de la Información. Investigación, redacción y curiosidad por las herramientas digitales.',
    location: 'Cartagena, Colombia',
    modality: 'hibrido',
    salary_range: 'Auxilio de práctica',
    deadline: '2026-12-05',
    status: 'open',
  },
  {
    id: 'vac-pacifico-finanzas',
    company: 'cmp-pacifico',
    title: 'Analista financiero junior',
    slug: 'analista-financiero-junior-pacifico',
    type: 'empleo',
    description:
      'Oferta ficticia de demostración para apoyar la construcción de contenidos de educación financiera y el análisis de indicadores de producto.',
    requirements:
      'Estudiantes de Economía, Finanzas o Administración. Manejo de Excel y capacidad para explicar conceptos complejos con lenguaje sencillo.',
    location: 'Bogotá, Colombia',
    modality: 'remoto',
    salary_range: '$3.000.000 - $3.800.000',
    deadline: '2026-11-25',
    status: 'open',
  },
  {
    id: 'vac-eco-sostenibilidad',
    company: 'cmp-ecocaribe',
    title: 'Practicante de sostenibilidad',
    slug: 'practicante-sostenibilidad-ecocaribe',
    type: 'practica',
    description:
      'Práctica ficticia para apoyar la medición de indicadores ambientales y la comunicación de resultados en proyectos de energía renovable.',
    requirements:
      'Estudiantes de Ingeniería Ambiental, Industrial o áreas afines. Interés por datos, sostenibilidad y comunicación de resultados.',
    location: 'Cartagena, Colombia',
    modality: 'presencial',
    salary_range: 'Auxilio de práctica',
    deadline: '2026-12-20',
    status: 'open',
  },
];

const technicalTests = [
  {
    id: 'test-nexo-datos',
    company: 'cmp-nexo',
    vacancy: 'vac-nexo-datos',
    title: 'Prueba técnica: análisis de datos',
    description:
      'Evaluación ficticia de demostración sobre consultas, interpretación de resultados y comunicación de hallazgos.',
    instructions:
      'Responde de forma individual. Puedes usar calculadora o una hoja de cálculo. No se evalúa memoria: se evalúa el razonamiento.',
    duration: 45,
    passing: 70,
    status: 'published',
    questions: [
      {
        prompt: '¿Qué cláusula SQL permite agrupar registros para calcular un promedio por zona de entrega?',
        type: 'multiple',
        options: ['ORDER BY', 'GROUP BY', 'WHERE', 'LIMIT'],
        answer: 'GROUP BY',
      },
      {
        prompt: 'Explica con tus palabras por qué un promedio general puede ocultar diferencias entre zonas de entrega.',
        type: 'open',
        options: [],
        answer: 'Respuesta abierta: se espera mencionar la variabilidad entre grupos y el riesgo de conclusiones agregadas.',
      },
      {
        prompt: 'Un reporte muestra 120 entregas y 18 llegaron tarde. ¿Cuál es el porcentaje de entregas tardías?',
        type: 'multiple',
        options: ['15%', '18%', '12%', '20%'],
        answer: '15%',
      },
    ],
  },
  {
    id: 'test-nexo-borrador',
    company: 'cmp-nexo',
    vacancy: 'vac-nexo-borrador',
    title: 'Borrador: evaluación de innovación',
    description:
      'Borrador privado de una prueba técnica de demostración. No está visible para estudiantes.',
    instructions: 'Pendiente de revisión por la empresa.',
    duration: 30,
    passing: 70,
    status: 'draft',
    questions: [
      {
        prompt: '¿Qué indicador usarías para medir la adopción de una nueva herramienta interna?',
        type: 'open',
        options: [],
        answer: 'Respuesta abierta de ejemplo.',
      },
    ],
  },
  {
    id: 'test-aurora-frontend',
    company: 'cmp-aurora',
    vacancy: 'vac-aurora-frontend',
    title: 'Evaluación de frontend accesible',
    description:
      'Prueba ficticia de demostración sobre HTML semántico, estados de interfaz y accesibilidad básica.',
    instructions:
      'Responde las preguntas. Para la pregunta abierta, describe una decisión de diseño y su impacto en accesibilidad.',
    duration: 60,
    passing: 75,
    status: 'published',
    questions: [
      {
        prompt: '¿Qué elemento HTML es más adecuado para un botón que envía un formulario?',
        type: 'multiple',
        options: ['<div>', '<a>', '<button>', '<span>'],
        answer: '<button>',
      },
      {
        prompt: '¿Qué atributo describe una imagen para lectores de pantalla?',
        type: 'multiple',
        options: ['alt', 'title-only', 'aria-hidden', 'tabindex'],
        answer: 'alt',
      },
      {
        prompt: 'Describe cómo mostrarías un error de validación sin depender únicamente del color.',
        type: 'open',
        options: [],
        answer: 'Respuesta abierta: se espera texto explícito, asociación con el campo y apoyo para tecnologías de asistencia.',
      },
    ],
  },
  {
    id: 'test-legal-tech',
    company: 'cmp-caribe-legal',
    vacancy: 'vac-legal-practica',
    title: 'Prueba de investigación jurídica',
    description:
      'Evaluación ficticia sobre formulación de consultas y trazabilidad de fuentes públicas.',
    instructions:
      'Todas las respuestas deben citar una fuente o explicar el criterio usado. No se permite presentar la prueba como asesoría jurídica.',
    duration: 30,
    passing: 70,
    status: 'published',
    questions: [
      {
        prompt: '¿Qué debe incluir una consulta de búsqueda jurídica para poder verificar sus resultados?',
        type: 'open',
        options: [],
        answer: 'Respuesta abierta: fuentes, criterios, fecha y alcance.',
      },
      {
        prompt: '¿Cuál es una buena práctica al usar un resultado de un buscador para un informe?',
        type: 'multiple',
        options: ['Copiarlo sin revisar', 'Citar la fuente original', 'Ocultar la fecha', 'Eliminar el contexto'],
        answer: 'Citar la fuente original',
      },
    ],
  },
  {
    id: 'test-pacifico-finanzas',
    company: 'cmp-pacifico',
    vacancy: 'vac-pacifico-finanzas',
    title: 'Prueba de educación financiera',
    description:
      'Evaluación ficticia sobre interpretación de tasas, cuotas y comunicación responsable.',
    instructions:
      'Responde con claridad. No se promueven productos financieros reales; todos los datos son de ejemplo.',
    duration: 30,
    passing: 70,
    status: 'published',
    questions: [
      {
        prompt: 'Una compra de $1.000.000 se paga en 12 cuotas de $110.000. ¿Cuál es el monto total pagado?',
        type: 'multiple',
        options: ['$1.100.000', '$1.200.000', '$1.320.000', '$1.000.000'],
        answer: '$1.320.000',
      },
      {
        prompt: 'Explica por qué la cuota mensual no alcanza para comparar el costo real de una compra.',
        type: 'open',
        options: [],
        answer: 'Respuesta abierta: se espera mencionar el plazo, los intereses y el costo total.',
      },
    ],
  },
  {
    id: 'test-eco-sostenibilidad',
    company: 'cmp-ecocaribe',
    vacancy: 'vac-eco-sostenibilidad',
    title: 'Prueba de indicadores ambientales',
    description:
      'Evaluación ficticia sobre interpretación de consumos y supuestos de medición.',
    instructions:
      'Indica los supuestos cuando sea necesario. No se certifican emisiones con esta prueba.',
    duration: 40,
    passing: 70,
    status: 'published',
    questions: [
      {
        prompt: '¿Por qué es importante documentar los supuestos al estimar emisiones?',
        type: 'open',
        options: [],
        answer: 'Respuesta abierta: permite interpretar y comparar resultados.',
      },
      {
        prompt: 'Si el consumo eléctrico baja 10% y el factor de emisión no cambia, ¿qué ocurre con las emisiones asociadas?',
        type: 'multiple',
        options: ['Aumentan 10%', 'Bajan 10%', 'No cambian', 'Se duplican'],
        answer: 'Bajan 10%',
      },
    ],
  },
];

const exercisesById = new Map();
for (const career of catalog) {
  for (const subject of career.subjects) {
    for (const topic of subject.topics) {
      for (const exercise of topic.exercises) {
        exercisesById.set(exercise.id, {
          ...exercise,
          subjectId: subject.id,
          subjectName: subject.name,
          careerId: career.career.id,
        });
      }
    }
  }
}

export function seedDatabase(db) {
  // Las cuentas demo conservan Campus123! salvo que se configure DEMO_PASSWORD.
  // El administrador usa ADMIN_PASSWORD (Render lo genera aleatoriamente).
  const demoPassword = process.env.DEMO_PASSWORD || 'Campus123!';
  const adminPassword = process.env.ADMIN_PASSWORD || demoPassword;
  // Costo 8 acelera el sembrado inicial en Render sin afectar a las cuentas demo.
  const passwordHash = bcrypt.hashSync(demoPassword, 8);
  const adminPasswordHash = bcrypt.hashSync(adminPassword, 10);
  const hashFor = () => bcrypt.hashSync(crypto.randomBytes(18).toString('hex'), 8);

  const deleteOrder = [
    'reports',
    'notifications',
    'deliverables',
    'applications',
    'messages',
    'conversations',
    'study_goals',
    'activity_log',
    'progress',
    'favorites',
    'user_subjects',
    'computer_loans',
    'computers',
    'technical_tests',
    'vacancies',
    'challenges',
    'companies',
    'profiles',
    'users',
    'exercises',
    'topics',
    'subjects',
    'careers',
  ];
  for (const table of deleteOrder) db.exec(`DELETE FROM ${table};`);

  const insertCareer = db.prepare(
    'INSERT INTO careers (id, slug, name, faculty, description, icon, color, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
  );
  const insertSubject = db.prepare(
    'INSERT INTO subjects (id, career_id, slug, name, description, semester, credits, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
  );
  const insertTopic = db.prepare(
    'INSERT INTO topics (id, subject_id, slug, name, description, position) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertExercise = db.prepare(`
    INSERT INTO exercises (
      id, topic_id, title, statement, difficulty, type, options, correct_answer, hint,
      procedure, explanation, author, source, published_at, tags, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  db.exec('BEGIN');
  try {
    for (const entry of catalog) {
      const c = entry.career;
      insertCareer.run(c.id, c.slug, c.name, c.faculty, c.description, c.icon, c.color);
      for (const subject of entry.subjects) {
        insertSubject.run(
          subject.id,
          c.id,
          subject.slug,
          subject.name,
          subject.description,
          subject.semester,
          subject.credits,
        );
        subject.topics.forEach((topic, topicIndex) => {
          insertTopic.run(topic.id, subject.id, topic.slug, topic.name, topic.description, topicIndex + 1);
          for (const exercise of topic.exercises) {
            insertExercise.run(
              exercise.id,
              topic.id,
              exercise.title,
              exercise.statement,
              exercise.difficulty,
              exercise.type,
              exercise.options ? JSON.stringify(exercise.options) : null,
              exercise.answer,
              exercise.hint,
              JSON.stringify(exercise.procedure),
              exercise.explanation,
              'Equipo CampusCode',
              'Ejercicio original de demostración',
              exercise.published_at,
              JSON.stringify(exercise.tags || []),
            );
          }
        });
      }
    }

    const insertUser = db.prepare(
      'INSERT INTO users (id, email, password_hash, role, full_name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    );
    const users = [
      ['usr-ana', 'estudiante@campuscode.co', passwordHash, 'student', 'Ana Sofía Torres', daysAgo(40)],
      ['usr-empresa-nexo', 'empresa@campuscode.co', passwordHash, 'company', 'Laura Mejía · Nexo Logística', daysAgo(35)],
      ['usr-admin', 'admin@campuscode.co', adminPasswordHash, 'admin', 'Administración CampusCode', daysAgo(50)],
      ['usr-empresa-aurora', 'aurora@campuscode.co', hashFor(), 'company', 'Equipo Aurora Salud', daysAgo(32)],
      ['usr-empresa-legal', 'legal@campuscode.co', hashFor(), 'company', 'Equipo Caribe Legal', daysAgo(30)],
      ['usr-empresa-pacifico', 'pacifico@campuscode.co', hashFor(), 'company', 'Equipo Pacífico Finanzas', daysAgo(28)],
      ['usr-empresa-eco', 'eco@campuscode.co', hashFor(), 'company', 'Equipo EcoCaribe', daysAgo(26)],
    ];
    for (const user of users) insertUser.run(...user);

    const insertProfile = db.prepare(`
      INSERT INTO profiles (user_id, headline, bio, career_id, semester, linkedin, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertProfile.run(
      'usr-ana',
      'Estudiante de Ingeniería Informática · 4.º semestre',
      'Me interesa el análisis de datos y la construcción de soluciones para ciudades. Uso CampusCode para practicar y prepararme para retos reales.',
      'car-ing-informatica',
      4,
      'https://www.linkedin.com/in/ejemplo-ana-torres',
      'blue',
    );
    insertProfile.run(
      'usr-empresa-nexo',
      'Coordinadora de innovación en Nexo Logística',
      'Perfil de demostración para gestionar retos y revisar postulaciones.',
      null,
      null,
      null,
      'cyan',
    );
    insertProfile.run(
      'usr-admin',
      'Equipo de administración de CampusCode',
      'Perfil de demostración con permisos de moderación.',
      null,
      null,
      null,
      'navy',
    );
    for (const company of companies.filter((item) => item.owner !== 'usr-empresa-nexo')) {
      insertProfile.run(company.owner, `Equipo de ${company.name}`, company.description, null, null, null, company.logo_color);
    }

    const insertCompany = db.prepare(`
      INSERT INTO companies (id, owner_id, name, slug, sector, description, website, location, logo_color, verified, is_demo, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    for (const company of companies) {
      insertCompany.run(
        company.id,
        company.owner,
        company.name,
        company.slug,
        company.sector,
        company.description,
        company.website,
        company.location,
        company.logo_color,
        company.verified,
        daysAgo(30),
      );
    }

    const insertChallenge = db.prepare(`
      INSERT INTO challenges (
        id, company_id, title, slug, summary, description, problem, skills, category,
        published_at, deadline, deliverables, requirements, status, featured, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    for (const challenge of challenges) {
      insertChallenge.run(
        challenge.id,
        challenge.company,
        challenge.title,
        challenge.slug,
        challenge.summary,
        challenge.description,
        challenge.problem,
        JSON.stringify(challenge.skills),
        challenge.category,
        challenge.published_at,
        challenge.deadline,
        challenge.deliverables,
        challenge.requirements,
        challenge.status,
        challenge.featured,
      );
    }

    const insertComputer = db.prepare(`
      INSERT INTO computers (id, room, equipment_number, condition, status, notes, is_demo, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    for (const computer of computers) {
      insertComputer.run(
        computer.id,
        computer.room,
        computer.number,
        computer.condition,
        computer.status,
        computer.notes,
        daysAgo(20),
      );
    }

    const insertComputerLoan = db.prepare(`
      INSERT INTO computer_loans (
        id, user_id, computer_id, room, equipment_number, entry_at, exit_at,
        condition, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const loan of computerLoans) {
      insertComputerLoan.run(
        loan.id,
        loan.user,
        loan.computer,
        loan.room,
        loan.number,
        loan.entry_at,
        loan.exit_at,
        loan.condition,
        loan.status,
        loan.notes,
        loan.entry_at,
      );
    }

    const insertVacancy = db.prepare(`
      INSERT INTO vacancies (
        id, company_id, title, slug, type, description, requirements, location,
        modality, salary_range, deadline, status, is_demo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);
    for (const vacancy of vacancies) {
      insertVacancy.run(
        vacancy.id,
        vacancy.company,
        vacancy.title,
        vacancy.slug,
        vacancy.type,
        vacancy.description,
        vacancy.requirements,
        vacancy.location,
        vacancy.modality,
        vacancy.salary_range,
        vacancy.deadline,
        vacancy.status,
        daysAgo(4),
        daysAgo(2),
      );
    }

    const insertTechnicalTest = db.prepare(`
      INSERT INTO technical_tests (
        id, company_id, vacancy_id, title, description, instructions,
        duration_minutes, passing_score, questions, status, is_demo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);
    for (const test of technicalTests) {
      insertTechnicalTest.run(
        test.id,
        test.company,
        test.vacancy,
        test.title,
        test.description,
        test.instructions,
        test.duration,
        test.passing,
        JSON.stringify(test.questions),
        test.status,
        daysAgo(3),
        daysAgo(1),
      );
    }

    const insertProgress = db.prepare(`
      INSERT INTO progress (user_id, exercise_id, status, attempts, last_answer, completed_at, updated_at)
      VALUES ('usr-ana', ?, 'completed', ?, ?, ?, ?)
    `);
    const completed = [
      ['ex-prog-output', 1, '15', daysAgo(9)],
      ['ex-prog-clasifica', 2, 'Negativo', daysAgo(8)],
      ['ex-ed-busqueda', 1, 'O(log n)', daysAgo(7)],
      ['ex-bd-llave', 1, 'Garantizar la integridad referencial entre dos tablas', daysAgo(6)],
      ['ex-bd-count', 2, '3', daysAgo(5)],
      ['ex-calculo-limite', 3, '4', daysAgo(4)],
      ['ex-fisica-cinematica', 1, '20', daysAgo(2)],
      ['ex-estadistica-media', 2, '6.8', daysAgo(1)],
    ];
    for (const row of completed) insertProgress.run(row[0], row[1], row[2], row[3], row[3]);
    db.prepare(
      "INSERT INTO progress (user_id, exercise_id, status, attempts, updated_at) VALUES ('usr-ana', 'ex-prog-suma', 'in_progress', 1, ?)",
    ).run(daysAgo(1));

    const insertFavorite = db.prepare('INSERT INTO favorites (user_id, exercise_id, created_at) VALUES (?, ?, ?)');
    for (const [exerciseId, date] of [
      ['ex-ed-altura', daysAgo(7)],
      ['ex-bd-group', daysAgo(5)],
      ['ex-calculo-derivada', daysAgo(3)],
      ['ex-salud-incidencia', daysAgo(1)],
    ]) {
      insertFavorite.run('usr-ana', exerciseId, date);
    }

    const insertGoal = db.prepare(`
      INSERT INTO study_goals (id, user_id, subject_id, title, metric, target_count, due_date, status, created_at)
      VALUES (?, 'usr-ana', ?, ?, 'exercises', ?, ?, 'active', ?)
    `);
    insertGoal.run('goal-general', null, 'Completar 15 ejercicios este mes', 15, '2026-10-31', daysAgo(20));
    insertGoal.run('goal-bd', 'sub-bd', 'Practicar 4 ejercicios de Bases de Datos', 4, '2026-11-10', daysAgo(12));

    const insertActivity = db.prepare(`
      INSERT INTO activity_log (user_id, type, entity_type, entity_id, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const row of completed) {
      const exercise = exercisesById.get(row[0]);
      insertActivity.run(
        'usr-ana',
        'exercise_completed',
        'exercise',
        row[0],
        JSON.stringify({ title: exercise.title, difficulty: exercise.difficulty, subject: exercise.subjectName }),
        row[3],
      );
    }
    insertActivity.run(
      'usr-ana',
      'favorite',
      'exercise',
      'ex-ed-altura',
      JSON.stringify({
        title: exercisesById.get('ex-ed-altura').title,
        subject: exercisesById.get('ex-ed-altura').subjectName,
      }),
      daysAgo(7),
    );
    insertActivity.run('usr-ana', 'goal_created', 'goal', 'goal-general', JSON.stringify({ title: 'Completar 15 ejercicios este mes' }), daysAgo(20));
    insertActivity.run(
      'usr-ana',
      'application',
      'challenge',
      'cha-ultima-milla',
      JSON.stringify({ title: 'Optimiza la última milla en Cartagena', company: 'Nexo Logística' }),
      daysAgo(2),
    );

    const insertConversation = db.prepare(`
      INSERT INTO conversations (id, user_id, subject_id, title, is_demo, created_at, updated_at)
      VALUES (?, 'usr-ana', ?, ?, 1, ?, ?)
    `);
    insertConversation.run('conv-demo-recursion', 'sub-prog1', '¿Cómo funciona la recursión?', daysAgo(3), daysAgo(3));

    const insertMessage = db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, provider, created_at)
      VALUES (?, 'conv-demo-recursion', ?, ?, ?, ?)
    `);
    insertMessage.run(
      'msg-demo-1',
      'user',
      'Estoy practicando recursión y no entiendo por qué una función se llama a sí misma. ¿Cómo puedo pensarlo sin perderme?',
      null,
      daysAgo(3),
    );
    insertMessage.run(
      'msg-demo-2',
      'assistant',
      'Este es un ejemplo de conversación guardada para la demostración. La recursión resuelve un problema dividiéndolo en una versión más pequeña del mismo problema.\n\nToda función recursiva necesita dos partes:\n\n1. **Caso base:** la condición que detiene las llamadas.\n2. **Caso recursivo:** una llamada a la misma función con una entrada más pequeña.\n\n```python\ndef factorial(n):\n    if n == 0:          # caso base\n        return 1\n    return n * factorial(n - 1)  # caso recursivo\n```\n\nPara `factorial(3)` la cadena es `3 * factorial(2)`, luego `2 * factorial(1)`, luego `1 * factorial(0)`. Al llegar a 0 se devuelve 1 y las multiplicaciones se resuelven hacia atrás.',
      'demo',
      daysAgo(3),
    );
    insertMessage.run(
      'msg-demo-3',
      'user',
      '¿Qué pasa si olvido el caso base?',
      null,
      daysAgo(3),
    );
    insertMessage.run(
      'msg-demo-4',
      'assistant',
      'Si no existe un caso base, la función sigue llamándose y consume la pila de llamadas hasta producir un `RecursionError` en Python. El caso base no solo debe existir: debe alcanzarse siempre con entradas válidas.',
      'demo',
      daysAgo(3),
    );

    const insertApplication = db.prepare(`
      INSERT INTO applications (id, challenge_id, user_id, message, status, created_at, updated_at)
      VALUES (?, ?, 'usr-ana', ?, ?, ?, ?)
    `);
    insertApplication.run(
      'app-ana-nexo',
      'cha-ultima-milla',
      'Me interesa analizar los tiempos de entrega y proponer una priorización de rutas con datos. Adjunto mi avance inicial.',
      'submitted',
      daysAgo(2),
      daysAgo(2),
    );
    insertApplication.run(
      'app-ana-pacifico',
      'cha-educacion-financiera',
      'Quiero aportar desde el análisis de datos y el diseño de una experiencia comprensible para estudiantes.',
      'reviewing',
      daysAgo(5),
      daysAgo(4),
    );
    db.prepare(
      "INSERT INTO deliverables (id, application_id, title, url, notes, created_at) VALUES (?, 'app-ana-nexo', ?, ?, ?, ?)",
    ).run(
      'del-ana-nexo',
      'Avance del análisis exploratorio',
      'https://github.com/ejemplo-ana/nexo-ultima-milla',
      'Repositorio de demostración con datos ficticios y supuestos iniciales.',
      daysAgo(1),
    );

    const insertNotification = db.prepare(
      'INSERT INTO notifications (id, user_id, title, body, link, read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    insertNotification.run(
      'notif-ana-1',
      'usr-ana',
      'Tu postulación fue recibida',
      'Nexo Logística recibió tu postulación al reto de última milla. Te avisaremos cuando cambie el estado.',
      '/mis-retos',
      0,
      daysAgo(2),
    );
    insertNotification.run(
      'notif-ana-2',
      'usr-ana',
      'Nuevo reto de sostenibilidad',
      'EcoCaribe Energía publicó un reto sobre huella de carbono en el campus.',
      '/retos/medicion-huella-carbono-campus',
      1,
      daysAgo(4),
    );
    insertNotification.run(
      'notif-empresa-1',
      'usr-empresa-nexo',
      'Nueva postulación recibida',
      'Ana Sofía Torres se postuló al reto de última milla.',
      '/empresa/retos/cha-ultima-milla',
      0,
      daysAgo(2),
    );
    insertNotification.run(
      'notif-admin-1',
      'usr-admin',
      'Reporte pendiente de revisión',
      'Un ejercicio de demostración fue reportado para revisión.',
      '/admin/reportes',
      0,
      daysAgo(1),
    );

    db.prepare(
      "INSERT INTO reports (id, reporter_id, target_type, target_id, reason, status, created_at) VALUES (?, 'usr-ana', 'exercise', 'ex-prog-output', ?, 'open', ?)",
    ).run(
      'report-demo',
      'El enunciado podría incluir un ejemplo adicional para quienes nunca han usado Python.',
      daysAgo(1),
    );

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

const demoPassword = process.env.DEMO_PASSWORD || 'Campus123!';

export const demoCredentials = [
  { role: 'Estudiante', email: 'estudiante@campuscode.co', password: demoPassword },
  { role: 'Empresa', email: 'empresa@campuscode.co', password: demoPassword },
  {
    role: 'Administrador',
    email: 'admin@campuscode.co',
    password: process.env.ADMIN_PASSWORD || demoPassword,
  },
];
