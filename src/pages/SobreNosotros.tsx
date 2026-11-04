import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Books,
  Brain,
  ChartLineUp,
  CheckCircle,
  Code,
  Database,
  LockKey,
  Robot,
  ShieldCheck,
  Sparkle,
  Trophy,
  UsersThree,
  XCircle,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Accordion';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { DemoNotice } from '@/components/common/DemoNotice';
import { buttonStyles } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { AiStatus, PublicSummary } from '@/lib/types';

const pillars = [
  { icon: Books, title: 'Banco de ejercicios', description: 'Contenido organizado por carrera, materia y tema, con pista, procedimiento y explicación.', to: '/ejercicios', tone: 'blue' },
  { icon: Robot, title: 'Asistente académico', description: 'Explicaciones paso a paso con proveedor real cuando está configurado o guía local identificada cuando no.', to: '/asistente', tone: 'violet' },
  { icon: ChartLineUp, title: 'Progreso verificable', description: 'Intentos, favoritos, actividad y objetivos calculados con tu uso real, no con métricas decorativas.', to: '/mi-progreso', tone: 'emerald' },
  { icon: Trophy, title: 'Retos empresariales', description: 'Problemas con contexto, requisitos y entregables para demostrar habilidades con evidencia.', to: '/retos', tone: 'amber' },
];

const faqs = [
  {
    title: '¿CampusCode ofrece tutorías o sesiones?',
    content: 'No. La plataforma no ofrece tutorías individuales ni grupales, no agenda sesiones y no procesa pagos por acompañamiento. El aprendizaje se apoya en ejercicios, explicaciones y retos.',
  },
  {
    title: '¿El contenido es oficial de la universidad?',
    content: 'No. Las carreras, materias, temas y ejercicios del catálogo son contenido original de demostración. No representan el pénsum oficial ni materiales entregados por docentes.',
  },
  {
    title: '¿Las cifras de la página son reales?',
    content: 'Las cifras del catálogo se calculan con la base de datos de demostración y se identifican como tales. No publicamos estadísticas de uso, estudiantes o empresas que no podamos sustentar.',
  },
  {
    title: '¿Qué pasa si no hay una clave de IA configurada?',
    content: 'El asistente responde con una guía local determinista, etiquetada como “Guía local”. No finge ser un modelo de lenguaje. Para activar IA real, el administrador debe configurar las variables de entorno del servidor.',
  },
  {
    title: '¿Puedo usar el proyecto como base para otro producto?',
    content: 'Es un proyecto académico de demostración. Revisa las condiciones de la institución y reemplaza los datos ficticios antes de cualquier uso real. La arquitectura está separada en frontend, API y base de datos para facilitar la adaptación.',
  },
];

export default function SobreNosotros() {
  const summary = useAsyncData(() => api.get<PublicSummary>('/public-summary'), []);
  const ai = useAsyncData(() => api.get<AiStatus>('/ai/status'), []);
  const status = ai.data;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_90%_0%,rgba(37,99,235,0.08),transparent_70%),radial-gradient(40%_50%_at_0%_100%,rgba(124,58,237,0.05),transparent_70%)]" aria-hidden="true" />
        <div className="container-page relative py-12 sm:py-16 lg:py-20">
          <PageHeader
            breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Sobre nosotros' }]}
            title="Aprender con propósito, no con atajos."
            description="CampusCode es un proyecto académico que conecta práctica, explicación, progreso y retos reales. Sin tutorías, sin métricas inventadas y sin presentar datos de demostración como reales."
            actions={<Link to="/registro" className={buttonStyles('primary', 'md')}>Crear cuenta gratis <ArrowRight size={15} aria-hidden="true" /></Link>}
          />
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Carreras demo', value: summary.data?.careers },
              { label: 'Materias demo', value: summary.data?.subjects },
              { label: 'Ejercicios originales', value: summary.data?.exercises },
              { label: 'Retos abiertos', value: summary.data?.challenges },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-line bg-white p-4">
                <p className="text-2xl font-semibold tracking-[-0.04em] text-ink">{item.value ?? '—'}</p>
                <p className="mt-0.5 text-[11px] text-muted">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10.5px] text-muted">{summary.data?.notice || 'Cifras calculadas sobre el catálogo de demostración.'}</p>
        </div>
      </section>

      <section className="section-space bg-paper">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <span className="eyebrow">El punto de partida</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-[2.5rem]">Un espacio para pensar, no solo para responder.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Muchas herramientas resuelven la tarea por ti. CampusCode hace lo contrario: te muestra el procedimiento, te da una pista cuando te trabas y te invita a intentarlo de nuevo.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              El proyecto nace en el contexto de la Universidad Mayor de Cartagena como una propuesta de emprendimiento académico. La meta es conectar lo que se estudia con evidencia concreta de lo que se sabe hacer.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge tone="amber">Proyecto de demostración</Badge>
              <Badge tone="emerald">Sin tutorías</Badge>
              <Badge tone="blue">Datos identificados</Badge>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <Link key={pillar.title} to={pillar.to} className="surface hover-lift group p-5 focus-ring">
                <span className={cn(
                  'flex size-10 items-center justify-center rounded-xl',
                  pillar.tone === 'blue' ? 'bg-electric/8 text-electric' : pillar.tone === 'violet' ? 'bg-violet/10 text-violet' : pillar.tone === 'emerald' ? 'bg-emerald/10 text-emerald' : 'bg-amber/10 text-amber',
                )}>
                  <pillar.icon size={20} weight="duotone" aria-hidden="true" />
                </span>
                <h3 className="mt-3.5 text-[14px] font-semibold text-ink group-hover:text-electric">{pillar.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{pillar.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-electric">Explorar <ArrowRight size={12} aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="ia" className="scroll-mt-24 border-y border-line bg-white">
        <div className="container-page section-space">
          <div className="grid gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="eyebrow">Inteligencia artificial</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-[2.4rem]">IA real cuando está configurada. Honestidad cuando no.</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                El asistente usa una API compatible con OpenAI desde el servidor. La clave nunca se envía al navegador. Si no hay credenciales, el sistema recurre a una guía local determinista y lo indica en cada respuesta.
              </p>
              <div className="mt-5">
                <Accordion
                  items={[
                    {
                      title: 'Cómo se activa la IA real',
                      content: (
                        <div className="space-y-2">
                          <p>Define estas variables en el archivo <code className="rounded bg-paper px-1 py-0.5 font-mono text-[11px]">.env</code> del servidor:</p>
                          <ul className="space-y-1 font-mono text-[11px]">
                            <li><code>AI_API_KEY=…</code></li>
                            <li><code>AI_BASE_URL=https://api.openai.com/v1</code></li>
                            <li><code>AI_MODEL=gpt-4o-mini</code></li>
                          </ul>
                          <p>Reinicia el servidor. El estado se puede verificar en <code>/api/ai/status</code> y en la cabecera del asistente.</p>
                          <p>Para forzar el modo local aunque exista una clave, usa <code>AI_MODE=local</code>.</p>
                        </div>
                      ),
                    },
                    {
                      title: 'Qué hace la guía local',
                      content: 'Es contenido educativo determinista preparado por el equipo. Reconoce temas como recursión, cálculo, SQL, física, estadística, derecho, biología y finanzas, y propone una ruta de estudio. No es un modelo de lenguaje y no se presenta como tal.',
                    },
                    {
                      title: 'Límites y cuidado',
                      content: 'El asistente puede equivocarse. No reemplaza la orientación docente ni la asesoría profesional en salud, derecho o finanzas. No ofrece tutorías, sesiones ni reservas. Las conversaciones se guardan solo en cuentas autenticadas.',
                    },
                  ]}
                />
              </div>
            </div>

            <div className="surface overflow-hidden">
              <div className={cn('border-b px-5 py-4', status?.configured ? 'border-emerald/20 bg-emerald/[0.05]' : 'border-amber/20 bg-amber/[0.05]')}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={cn('flex size-9 items-center justify-center rounded-xl', status?.configured ? 'bg-emerald/10 text-emerald' : 'bg-amber/10 text-amber')}>
                      {status?.configured ? <Sparkle size={18} weight="duotone" aria-hidden="true" /> : <Brain size={18} weight="duotone" aria-hidden="true" />}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-ink">{status?.configured ? 'IA conectada' : 'Modo guía local'}</p>
                      <p className="text-[10.5px] text-muted">{status?.configured ? status.model : 'Sin proveedor externo configurado'}</p>
                    </div>
                  </div>
                  <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-semibold', status?.configured ? 'border-emerald/25 bg-white text-emerald' : 'border-amber/25 bg-white text-amber')}>
                    {status?.configured ? 'Live' : 'Local'}
                  </span>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <p className="text-[12.5px] leading-relaxed text-muted">{status?.message || 'Consultando el estado del asistente…'}</p>
                <div className="rounded-xl border border-line bg-paper p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Ejemplo de respuesta local</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                    “<strong className="text-ink">Guía local de estudio.</strong> La IA no está conectada en este entorno. Te comparto una ruta de razonamiento preparada por el equipo de CampusCode; no es una respuesta generada por un modelo de lenguaje.”
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald/20 bg-emerald/[0.04] p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald"><CheckCircle size={13} weight="fill" aria-hidden="true" /> Sí hace</p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-muted">Explicar, ejemplificar y proponer práctica.</p>
                  </div>
                  <div className="rounded-lg border border-rose/20 bg-rose/[0.04] p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose"><XCircle size={13} weight="fill" aria-hidden="true" /> No hace</p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-muted">Simular IA, inventar fuentes ni ofrecer tutorías.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="privacidad" className="scroll-mt-24 bg-paper">
        <div className="container-page section-space">
          <div className="max-w-2xl">
            <span className="eyebrow">Privacidad y confianza</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-[2.4rem]">Seguridad que se valida en el servidor.</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">Ocultar un botón no es seguridad. Cada operación sensible comprueba la sesión, el rol y la propiedad del recurso en la API.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: LockKey, title: 'Contraseñas con hash', description: 'bcrypt con costo 12. Nunca se almacenan ni se registran en texto plano.' },
              { icon: ShieldCheck, title: 'Sesión httpOnly', description: 'JWT en cookie SameSite=Lax, sin tokens accesibles desde JavaScript.' },
              { icon: UsersThree, title: 'Roles y propiedad', description: 'Estudiante, empresa y administrador. Cada empresa solo ve sus propios retos.' },
              { icon: Database, title: 'Consultas parametrizadas', description: 'SQL preparado para evitar inyección. Validación y límites de tasa en la API.' },
            ].map((item) => (
              <article key={item.title} className="surface p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-electric/8 text-electric"><item.icon size={20} weight="duotone" aria-hidden="true" /></span>
                <h3 className="mt-3.5 text-[13px] font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{item.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h3 className="text-sm font-semibold text-ink">Tus datos, tus conversaciones</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">El progreso, los favoritos, los objetivos y las conversaciones pertenecen a cada cuenta. No se usan para publicidad ni se comparten con las empresas sin una postulación.</p>
            </div>
            <Link to="/configuracion" className={buttonStyles('secondary', 'sm')}>Gestionar mi cuenta</Link>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="container-page py-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">Lo que este proyecto no es</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">La claridad también es parte de la experiencia. Estos límites son intencionales.</p>
              <ul className="mt-5 space-y-3">
                {[
                  'No es un servicio de tutorías ni agenda sesiones.',
                  'No es el pénsum oficial ni una evaluación de la institución.',
                  'No es una bolsa de empleo ni garantiza contratación.',
                  'No publica estadísticas de uso o alianzas no verificadas.',
                  'No presenta la guía local como inteligencia artificial.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                    <XCircle size={16} className="mt-0.5 shrink-0 text-rose" aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-paper p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Code size={17} className="text-electric" aria-hidden="true" /> Cómo está construido</h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">Una aplicación full stack pensada para ejecutarse localmente sin servicios externos obligatorios.</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Frontend', value: 'React 19, TypeScript, Vite, Tailwind CSS, React Router', progress: 100 },
                  { label: 'Backend', value: 'Node.js, Express 5, JWT, bcrypt, validación y límites de tasa', progress: 100 },
                  { label: 'Datos', value: 'SQLite en runtime · esquema PostgreSQL de referencia', progress: 100 },
                  { label: 'IA', value: status?.configured ? 'Proveedor compatible con OpenAI configurado' : 'Pendiente de credenciales · guía local activa', progress: status?.configured ? 100 : 35 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between gap-3 text-[11px]"><span className="font-semibold text-ink">{item.label}</span><span className="text-muted">{item.progress === 100 ? 'Listo' : 'Configurar'}</span></div>
                    <ProgressBar value={item.progress} tone={item.progress === 100 ? 'emerald' : 'amber'} size="sm" label={`Estado de ${item.label}`} />
                    <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space bg-paper">
        <div className="container-page grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink">Transparencia antes que marketing.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">Si algo no está implementado, se dice. Si algo es un ejemplo, se etiqueta. Si falta configuración, se explica cómo completarla.</p>
            <DemoNotice className="mt-5">
              Este sitio usa datos de demostración. No contiene testimonios, cifras de usuarios ni alianzas empresariales reales.
            </DemoNotice>
          </div>
          <Accordion items={faqs} />
        </div>
      </section>

      <section className="container-page pb-14">
        <div className="overflow-hidden rounded-3xl bg-ink-gradient p-7 text-white sm:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <Badge tone="navy" className="border-white/15 bg-white/10 text-white"><BookOpen size={11} aria-hidden="true" /> Empieza por una materia</Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">Aprende con evidencia, no con promesas.</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">Explora el catálogo, resuelve un ejercicio y mira cómo se construye tu progreso desde cero.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/catalogo" className={buttonStyles('primary', 'md')}>Explorar materias</Link>
              <Link to="/ejercicios" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-ring">Practicar ahora</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
