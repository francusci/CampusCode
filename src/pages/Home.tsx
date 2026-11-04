import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookmarkSimple,
  Books,
  Buildings,
  ChartLineUp,
  CheckCircle,
  Code,
  Compass,
  Laptop,
  Robot,
  ShieldCheck,
  Sparkle,
  Target,
  Trophy,
  UsersThree,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth';
import { buttonStyles } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CareerIcon } from '@/components/ui/CareerIcon';
import { Reveal } from '@/components/ui/Reveal';
import { Accordion } from '@/components/ui/Accordion';
import { Skeleton } from '@/components/ui/Spinner';
import { CampusPulse } from '@/components/home/CampusPulse';
import { QuickAccess } from '@/components/home/QuickAccess';
import { AiPreview } from '@/components/home/AiPreview';
import { SampleProgress } from '@/components/home/SampleProgress';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { difficultyClass, difficultyLabels } from '@/lib/format';
import type { AiStatus, Challenge, Career, Exercise, PublicSummary } from '@/lib/types';

const stats = [
  { key: 'careers' as const, label: 'Áreas de conocimiento' },
  { key: 'subjects' as const, label: 'Materias de ejemplo' },
  { key: 'exercises' as const, label: 'Ejercicios originales' },
  { key: 'challenges' as const, label: 'Retos abiertos' },
];

const steps = [
  {
    icon: UsersThree,
    title: 'Crea tu perfil',
    description: 'Elige tu carrera, semestre e intereses. Tu panel se adapta a lo que estudias.',
  },
  {
    icon: Books,
    title: 'Elige una materia',
    description: 'Explora temas, revisa cuántos ejercicios hay y empieza por donde necesitas.',
  },
  {
    icon: Robot,
    title: 'Practica y pregunta',
    description: 'Resuelve, usa pistas y pide al asistente que explique el procedimiento.',
  },
  {
    icon: Trophy,
    title: 'Demuestra lo aprendido',
    description: 'Postúlate a retos, registra entregables y construye evidencia de tus habilidades.',
  },
];

const benefits = [
  {
    icon: Books,
    title: 'Práctica alineada a tu materia',
    description: 'Ejercicios organizados por carrera, materia y tema, con dificultad y tipo de respuesta.',
    tone: 'white' as const,
  },
  {
    icon: ChartLineUp,
    title: 'Progreso basado en datos reales',
    description: 'Porcentajes calculados con tu actividad, no con métricas decorativas.',
    tone: 'white' as const,
  },
  {
    icon: Trophy,
    title: 'Retos que conectan con empresas',
    description: 'Desafíos con entregables claros para mostrar cómo piensas y qué puedes construir.',
    tone: 'white' as const,
  },
  {
    icon: BookmarkSimple,
    title: 'Tu espacio de estudio',
    description: 'Favoritos, objetivos e historial para retomar exactamente donde lo dejaste.',
    tone: 'tint' as const,
  },
  {
    icon: ShieldCheck,
    title: 'Privacidad por diseño',
    description: 'Roles, permisos en servidor y contraseñas protegidas. Solo los datos necesarios.',
    tone: 'tint' as const,
  },
];

const faqs = [
  {
    title: '¿CampusCode es gratuito?',
    content: 'Sí. El acceso a materias, ejercicios, asistente y retos es gratuito para estudiantes. Es un proyecto académico de demostración, no un servicio comercial en producción.',
  },
  {
    title: '¿La plataforma ofrece tutorías?',
    content: 'No. CampusCode no ofrece tutorías individuales ni grupales, ni reservas de sesiones. El aprendizaje se apoya en el banco de ejercicios, los recursos académicos y el asistente de IA.',
  },
  {
    title: '¿Los ejercicios son material oficial de las asignaturas?',
    content: 'No. Todos los ejercicios son originales y de demostración. No representan el pénsum oficial ni materiales entregados por los docentes.',
  },
  {
    title: '¿La inteligencia artificial está conectada?',
    content: 'Depende de la configuración del servidor. Si existe una clave de API, el asistente se conecta a un proveedor compatible con OpenAI. Si no, responde con una guía local claramente identificada. La interfaz siempre muestra el estado real.',
  },
  {
    title: '¿Cómo funcionan los retos empresariales?',
    content: 'Las empresas publican desafíos con requisitos y entregables. Los estudiantes se postulan, registran enlaces a sus entregables y consultan el estado. Las empresas y los retos de la demostración son ficticios y están etiquetados como ejemplos.',
  },
  {
    title: '¿Mis datos y mi progreso son privados?',
    content: 'Sí. El progreso, los favoritos y las conversaciones pertenecen a cada cuenta. Los permisos se validan en el servidor y las contraseñas se almacenan con hash, nunca en texto plano.',
  },
];

export default function Home() {
  const { user } = useAuth();
  const summary = useAsyncData(() => api.get<PublicSummary>('/public-summary'), []);
  const careers = useAsyncData(() => api.get<{ items: Career[] }>('/careers'), []);
  const challenges = useAsyncData(() => api.get<{ items: Challenge[] }>('/challenges?status=open'), []);
  const exercises = useAsyncData(() => api.get<{ items: Exercise[] }>('/exercises', { limit: 3 }), []);
  const ai = useAsyncData(() => api.get<AiStatus>('/ai/status'), []);

  const openChallenges = (challenges.data?.items || []).slice(0, 3);
  const featuredCareers = (careers.data?.items || []).slice(0, 6);
  const total = summary.data;

  return (
    <div>
      {/* Hero ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_20%,rgba(37,99,235,0.09),transparent_70%),radial-gradient(40%_50%_at_10%_90%,rgba(124,58,237,0.06),transparent_70%)]" aria-hidden="true" />
        <div className="bg-grid pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-40 [mask-image:linear-gradient(to_left,black,transparent)]" aria-hidden="true" />
        <div className="container-page relative grid grid-cols-1 items-center gap-12 pb-14 pt-12 sm:pt-16 lg:min-h-[calc(100dvh-70px)] lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:py-16">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-electric/15 bg-electric/[0.055] px-3 py-1 text-[11px] font-semibold text-electric">
              <Sparkle size={13} weight="fill" aria-hidden="true" />
              Universidad Mayor de Cartagena · CampusCode
            </span>
            <h1 className="mt-5 text-[2.65rem] font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-6xl lg:text-[4rem]">
              Aprende, practica y<br className="hidden sm:block" /> conecta con tu <span className="text-gradient">futuro.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-muted sm:text-[17px]">
              Materias, ejercicios, préstamo de computadores y oportunidades de empresas en una sola plataforma web.
              Sin instalaciones, desde cualquier navegador.
            </p>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Link to={user ? '/dashboard' : '/registro'} className={buttonStyles('primary', 'lg')}>
                {user ? 'Ir a mi panel' : 'Crear mi cuenta'}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link to="/catalogo" className={buttonStyles('secondary', 'lg')}>
                Explorar materias
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-muted">
              <CheckCircle size={14} weight="fill" className="text-emerald" aria-hidden="true" />
              100% web y responsivo. Proyecto de demostración.
            </p>
          </div>
          <div className="relative pb-6 pl-3 pr-3 sm:px-8 lg:px-4 lg:pl-8">
            <CampusPulse summary={total} loading={summary.loading} />
          </div>
        </div>
      </section>

      {/* Catálogo real ------------------------------------------------------- */}
      <section className="border-b border-line bg-white">
        <div className="container-page flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            {stats.map((item) => (
              <div key={item.key} className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-[-0.04em] text-ink">
                  {total ? new Intl.NumberFormat('es-CO').format(total[item.key]) : '—'}
                </span>
                <span className="text-[11px] text-muted">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-amber/20 bg-amber/8 px-2.5 py-1 text-[10px] font-semibold text-amber">Catálogo de demostración</span>
            <Link to="/catalogo" className="inline-flex items-center gap-1 text-xs font-semibold text-electric hover:underline">
              Ver catálogo <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Accesos rápidos ----------------------------------------------------- */}
      <section className="border-b border-line bg-paper py-10 sm:py-14">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Reveal className="max-w-xl">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-electric">Campus conectado</span>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.15rem]">Accesos rápidos</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                Entra directo a los servicios que ya usas: tu tablero, los equipos del campus y el portal de empleo.
              </p>
            </Reveal>
            <Link to="/prestamo-pcs" className={buttonStyles('secondary', 'md', 'shrink-0')}>
              <Laptop size={16} aria-hidden="true" />
              Registro de PCs
            </Link>
          </div>
          <QuickAccess />
        </div>
      </section>

      {/* Beneficios ---------------------------------------------------------- */}
      <section className="section-space bg-paper">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.5rem]">Todo lo necesario para aprender con propósito</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Cuatro pilares conectados: practicar, comprender, medir tu avance y demostrar lo que sabes.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Reveal className="lg:col-span-3" delay={40}>
              <article className="bg-ink-gradient relative h-full overflow-hidden rounded-3xl p-6 text-white sm:p-7">
                <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full border border-white/10" aria-hidden="true" />
                <div className="pointer-events-none absolute -right-2 top-12 size-28 rounded-full border border-white/10" aria-hidden="true" />
                <span className="flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#c7d2fe]">
                  <Robot size={23} weight="duotone" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-white">Pregunta, entiende, aplica</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">
                  El asistente explica el razonamiento paso a paso, con código y matemáticas cuando hacen falta.
                </p>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    <Sparkle size={12} aria-hidden="true" /> Ejemplo de explicación
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-white/80">
                    “Primero identifica el caso base. Después comprueba que cada llamada reduzca la entrada.”
                  </p>
                </div>
              </article>
            </Reveal>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3">
              {benefits.slice(0, 4).map((benefit, index) => (
                <Reveal key={benefit.title} delay={80 + index * 40}>
                  <article className={benefit.tone === 'tint' ? 'h-full rounded-3xl border border-electric/10 bg-[#edf3ff] p-5' : 'surface h-full p-5'}>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-white text-electric shadow-sm">
                      <benefit.icon size={20} weight="duotone" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold text-ink">{benefit.title}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{benefit.description}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal className="mt-4" delay={160}>
            <article className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                  <ShieldCheck size={20} weight="duotone" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">{benefits[4].title}</h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{benefits[4].description}</p>
                </div>
              </div>
              <Link to="/sobre-nosotros#privacidad" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-electric hover:underline">
                Cómo cuidamos tus datos <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </article>
          </Reveal>
        </div>
      </section>

      {/* Carreras ------------------------------------------------------------ */}
      <section className="section-space bg-white">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Reveal className="max-w-xl">
              <h2 className="text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.5rem]">Explora por área de conocimiento</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">Siete áreas de ejemplo, veinte materias y temas organizados para encontrar lo que necesitas.</p>
            </Reveal>
            <Link to="/catalogo" className={buttonStyles('secondary', 'md', 'shrink-0')}>
              Ver todas las áreas <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {careers.loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="surface p-5">
                    <Skeleton className="size-12 rounded-2xl" />
                    <Skeleton className="mt-4 h-5 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-full" />
                    <Skeleton className="mt-5 h-3 w-1/2" />
                  </div>
                ))
              : featuredCareers.map((career, index) => (
                  <Reveal key={career.id} delay={index * 35}>
                    <Link to={`/carreras/${career.slug}`} className="surface hover-lift group flex h-full flex-col p-5 focus-ring">
                      <div className="flex items-start justify-between">
                        <CareerIcon name={career.icon} color={career.color} />
                        <ArrowUpRight size={17} className="text-muted/50 transition group-hover:text-electric" aria-hidden="true" />
                      </div>
                      <h3 className="mt-4 text-[17px] font-semibold text-ink transition group-hover:text-electric">{career.name}</h3>
                      <p className="mt-1 text-[11px] text-muted">{career.faculty}</p>
                      <p className="clamp-2 mt-2 text-[12.5px] leading-relaxed text-muted">{career.description}</p>
                      <div className="mt-auto flex items-center gap-3 border-t border-line/80 pt-4 text-[10px] font-medium text-muted">
                        <span>{career.counts.subjects} materias</span>
                        <span className="size-1 rounded-full bg-line-strong" aria-hidden="true" />
                        <span>{career.counts.exercises} ejercicios</span>
                      </div>
                    </Link>
                  </Reveal>
                ))}
          </div>
        </div>
      </section>

      {/* Banco de ejercicios ------------------------------------------------- */}
      <section className="bg-paper pb-5 pt-16 lg:pt-24">
        <div className="container-page">
          <Reveal className="overflow-hidden rounded-[2rem] bg-ink-gradient p-6 text-white sm:p-9 lg:p-12">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <Badge tone="navy" className="border-white/15 bg-white/10 text-white/80">Banco de ejercicios</Badge>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-[2.5rem]">Practica en serio, con contexto</h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
                  Enunciados originales por materia y tema. Comprueba tu respuesta, pide una pista o revisa el procedimiento completo después de intentarlo.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link to="/ejercicios" className={buttonStyles('secondary', 'md')}>
                    Explorar ejercicios <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                  <Link to="/catalogo" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus-ring">
                    Ver materias
                  </Link>
                </div>
              </div>
              <div className="space-y-2.5">
                {exercises.loading
                  ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/10" />)
                  : (exercises.data?.items || []).map((exercise) => (
                      <Link
                        key={exercise.id}
                        to={`/ejercicios/${exercise.id}`}
                        className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.065] p-4 transition hover:border-white/20 hover:bg-white/[0.1] focus-ring"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80">
                          <Code size={19} weight="duotone" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-white">{exercise.title}</p>
                          <p className="mt-0.5 truncate text-[10.5px] text-white/50">
                            {exercise.subject.name} · {difficultyLabels[exercise.difficulty]}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${difficultyClass[exercise.difficulty]}`}>
                          {difficultyLabels[exercise.difficulty]}
                        </span>
                        <ArrowUpRight size={14} className="shrink-0 text-white/40 transition group-hover:text-white" aria-hidden="true" />
                      </Link>
                    ))}
                <p className="pt-1 text-right text-[9px] uppercase tracking-[0.14em] text-white/35">Ejercicios de demostración</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Asistente IA -------------------------------------------------------- */}
      <section className="section-space bg-paper">
        <div className="container-page grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet/15 bg-violet/8 px-3 py-1 text-[11px] font-semibold text-violet">
              <Sparkle size={13} weight="fill" aria-hidden="true" /> Asistente académico
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.5rem]">Aprende con preguntas, no con respuestas sueltas</h2>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
              Un espacio para pedir explicaciones, revisar código, entender un procedimiento o preparar un tema antes de clase.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Explicaciones paso a paso y con contexto de la materia.',
                'Bloques de código legibles y ecuaciones con formato.',
                'Historial organizado por conversación y materia.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <CheckCircle size={17} weight="fill" className="mt-0.5 shrink-0 text-emerald" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className={`mt-5 rounded-xl border p-3 text-[11px] leading-relaxed ${ai.data?.configured ? 'border-emerald/20 bg-emerald/6 text-emerald' : 'border-amber/20 bg-amber/6 text-amber'}`}>
              {ai.data?.message || 'Consultando el estado del asistente…'}
            </div>
            <Link to="/asistente" className={buttonStyles('navy', 'md', 'mt-6')}>
              Abrir el asistente <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal delay={80}>
            <AiPreview configured={Boolean(ai.data?.configured)} />
          </Reveal>
        </div>
      </section>

      {/* Progreso ------------------------------------------------------------ */}
      <section className="section-space bg-white">
        <div className="container-page grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.5rem]">Cada práctica deja un registro útil</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
              Consulta ejercicios completados, temas practicados, evolución por materia y objetivos personales. Los porcentajes se calculan con tu actividad real.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { icon: ChartLineUp, title: 'Progreso por materia', text: 'Sin promedios inventados.' },
                { icon: Target, title: 'Objetivos de estudio', text: 'Metas con avance verificable.' },
                { icon: CheckCircle, title: 'Historial de actividad', text: 'Qué hiciste y cuándo.' },
                { icon: Compass, title: 'Fortalezas y refuerzo', text: 'Dónde practicar a continuación.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-line bg-paper p-4">
                  <item.icon size={19} className="text-electric" weight="duotone" aria-hidden="true" />
                  <p className="mt-2 text-[12px] font-semibold text-ink">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{item.text}</p>
                </div>
              ))}
            </div>
            <Link to={user ? '/mi-progreso' : '/registro'} className={buttonStyles('primary', 'md', 'mt-6')}>
              {user ? 'Ver mi progreso' : 'Crear mi cuenta'} <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal delay={80}>
            <SampleProgress />
          </Reveal>
        </div>
      </section>

      {/* Retos --------------------------------------------------------------- */}
      <section className="section-space bg-paper">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Reveal className="max-w-xl">
              <h2 className="text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.5rem]">Retos para llevar tu aprendizaje más lejos</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">Problemas con entregables claros, publicados por empresas de diferentes sectores.</p>
            </Reveal>
            <Link to="/retos" className={buttonStyles('secondary', 'md', 'shrink-0')}>
              Ver todos los retos <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {challenges.loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="surface p-5">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="mt-4 h-6 w-4/5" />
                    <Skeleton className="mt-2 h-4 w-full" />
                    <Skeleton className="mt-6 h-10 w-full" />
                  </div>
                ))
              : openChallenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)}
          </div>
          <p className="mt-4 text-[10px] text-muted">Empresas y retos de demostración. No representan alianzas reales.</p>
        </div>
      </section>

      {/* Cómo funciona ------------------------------------------------------- */}
      <section className="section-space bg-white">
        <div className="container-page">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.5rem]">De la duda a la evidencia, en cuatro pasos</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">Un recorrido simple, sin tutorías ni sesiones que agendar.</p>
          </Reveal>
          <div className="relative mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-7 hidden border-t border-dashed border-line-strong lg:block" aria-hidden="true" />
            {steps.map((step, index) => (
              <Reveal key={step.title} delay={index * 60} className="relative">
                <div className="flex flex-col items-center text-center">
                  <span className="relative z-10 flex size-14 items-center justify-center rounded-2xl border border-line bg-white text-electric shadow-soft">
                    <step.icon size={24} weight="duotone" aria-hidden="true" />
                  </span>
                  <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Paso {index + 1}</span>
                  <h3 className="mt-2 text-base font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-muted">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Empresas ------------------------------------------------------------ */}
      <section className="bg-white pb-5 pt-4">
        <div className="container-page">
          <Reveal className="overflow-hidden rounded-[2rem] bg-ink-gradient p-6 text-white sm:p-10 lg:p-12">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <Badge tone="navy" className="border-white/15 bg-white/10 text-white/75">Para empresas</Badge>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-[2.5rem]">Publica un reto, descubre talento</h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/65">
                  Crea un perfil, publica desafíos con requisitos y entregables, revisa postulaciones y gestiona el estado de tus retos.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Perfil empresarial y retos propios, con permisos separados.',
                    'Postulaciones y entregables organizados por desafío.',
                    'Estados de revisión para acompañar el proceso.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-white/75">
                      <CheckCircle size={17} weight="fill" className="mt-0.5 shrink-0 text-[#86efac]" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap gap-2">
                  <Link to="/registro?rol=empresa" className={buttonStyles('secondary', 'md')}>
                    Soy empresa <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                  <Link to="/empresas" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus-ring">
                    Conocer el portal
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/[0.055] p-4 backdrop-blur">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Buildings size={16} className="text-white/60" aria-hidden="true" />
                    <span className="text-[11px] font-semibold text-white/80">Nuevo reto</span>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/50">Vista del panel</span>
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-white/35">Título del reto</p>
                    <div className="mt-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] text-white/70">Optimiza la última milla</div>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-white/35">Habilidades</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {['Análisis de datos', 'SQL', 'Logística'].map((skill) => (
                        <span key={skill} className="rounded-md border border-white/10 bg-white/[0.08] px-2 py-0.5 text-[9.5px] text-white/65">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-white/35">Fecha límite</p>
                      <p className="text-[11px] text-white/70">15 dic 2026</p>
                    </div>
                    <span className="rounded-lg bg-white/12 px-2.5 py-1 text-[10px] font-semibold text-white/80">Publicar</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ ---------------------------------------------------------------- */}
      <section className="section-space bg-paper">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.5rem]">Preguntas frecuentes</h2>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">Lo esencial sobre el alcance, la IA y los datos de demostración.</p>
            <div className="mt-6 rounded-2xl border border-line bg-white p-4">
              <p className="text-[11px] font-semibold text-ink">¿Necesitas algo más?</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">La documentación del proyecto explica la instalación, la configuración de IA y las pruebas realizadas.</p>
              <Link to="/sobre-nosotros" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-electric hover:underline">
                Conocer el proyecto <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <Accordion items={faqs} />
          </Reveal>
        </div>
      </section>

      {/* CTA final ----------------------------------------------------------- */}
      <section className="bg-paper pb-20">
        <div className="container-page">
          <Reveal className="relative overflow-hidden rounded-[2rem] bg-ink-gradient px-6 py-12 text-center text-white sm:px-10 sm:py-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(124,58,237,0.25),transparent_70%)]" aria-hidden="true" />
            <div className="bg-dots pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden="true" />
            <div className="relative mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/75">
                <Sparkle size={12} weight="fill" aria-hidden="true" /> Aprende, conecta y construye tu futuro
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-[2.7rem]">Tu próximo avance empieza con una práctica</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/65">
                Crea tu perfil, elige una materia y resuelve tu primer ejercicio. Sin costo y sin instalar nada.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
                <Link to={user ? '/dashboard' : '/registro'} className={buttonStyles('secondary', 'lg')}>
                  {user ? 'Continuar en mi panel' : 'Comenzar gratis'} <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link to="/ejercicios" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-ring">
                  Explorar ejercicios
                </Link>
              </div>
              <p className="mt-4 text-[10px] text-white/40">Proyecto académico de demostración · Contenido identificado como ejemplo</p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
