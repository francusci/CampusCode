import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Buildings,
  CalendarCheck,
  CheckCircle,
  ClipboardText,
  Clock,
  Handshake,
  MapPin,
  ShieldCheck,
  Sparkle,
  UsersThree,
} from '@phosphor-icons/react';
import { api, ApiError } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import { Modal } from '@/components/ui/Modal';
import { CardSkeleton, PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { DemoNotice } from '@/components/common/DemoNotice';
import { daysUntil, formatDate, plural } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { TechnicalTest, Vacancy } from '@/lib/types';

interface PublicCompany {
  id: string;
  name: string;
  slug: string;
  sector: string;
  description: string;
  website: string | null;
  location: string | null;
  logoColor: string;
  verified: boolean;
  isDemo: boolean;
  openChallenges: number;
}

const logoColors: Record<string, string> = {
  blue: 'bg-[#dbe7ff] text-[#1d4ed8]',
  emerald: 'bg-[#d9f7eb] text-[#087f5b]',
  rose: 'bg-[#ffe4ea] text-[#9f1239]',
  violet: 'bg-[#ece7ff] text-[#6d28d9]',
  amber: 'bg-[#fdf0d5] text-[#92400e]',
  cyan: 'bg-[#d9f4fa] text-[#0e7490]',
};

const benefits = [
  { icon: Briefcase, title: 'Vacantes con contexto', description: 'Publica empleos, prácticas o roles junior con requisitos, modalidad, rango salarial y fecha límite.' },
  { icon: ClipboardText, title: 'Pruebas técnicas propias', description: 'Agrega preguntas abiertas o de opción múltiple, define duración y puntaje mínimo de admisión.' },
  { icon: UsersThree, title: 'Postulaciones organizadas', description: 'Revisa perfiles, mensajes y entregables en un solo panel. Actualiza el estado y notifica automáticamente.' },
  { icon: ShieldCheck, title: 'Permisos en servidor', description: 'Cada empresa solo accede a sus vacantes, pruebas, retos y postulaciones. La autorización no depende de la interfaz.' },
];

const steps = [
  { icon: Buildings, title: 'Crea el perfil de tu empresa', description: 'Registra el sector, la descripción y los canales de contacto. El perfil queda vinculado a tu cuenta.' },
  { icon: Briefcase, title: 'Publica una vacante', description: 'Define el rol, la modalidad, los requisitos, el rango salarial y la fecha límite.' },
  { icon: ClipboardText, title: 'Agrega la prueba técnica', description: 'Construye preguntas de admisión y vincúlalas a la vacante. Puedes guardar borradores antes de publicar.' },
  { icon: CalendarCheck, title: 'Revisa y decide', description: 'Consulta postulaciones, revisa entregables y cambia el estado. El estudiante recibe una notificación.' },
];

const faqs = [
  {
    title: '¿Publicar retos tiene algún costo?',
    content: 'No en esta demostración. CampusCode es un proyecto académico y no procesa pagos ni suscripciones. Si se convirtiera en un servicio comercial, las condiciones se comunicarían antes de cualquier cobro.',
  },
  {
    title: '¿Los retos y las vacantes son ofertas reales?',
    content: 'No. Los retos son ejercicios de evaluación y aprendizaje. Las vacantes y pruebas técnicas de esta demostración son ficticias, están etiquetadas como ejemplos y no garantizan contratación, pasantía ni remuneración.',
  },
  {
    title: '¿Cómo se agrega una prueba técnica?',
    content: 'La empresa crea la prueba desde su panel, define duración, puntaje mínimo y preguntas, y puede vincularla a una vacante. Los estudiantes ven una vista previa pública sin las respuestas correctas.',
  },
  {
    title: '¿Quién puede ver los entregables?',
    content: 'Solo la empresa dueña del reto y el estudiante autor. La administración puede revisar reportes, pero no se muestran entregables en el catálogo público.',
  },
  {
    title: '¿Las empresas del catálogo son reales?',
    content: 'No. Las cinco empresas y los retos de la demostración son ficticios y están etiquetados como ejemplos. No representan alianzas reales con CampusCode.',
  },
];

export default function Empresas() {
  const { push } = useToast();
  const companies = useAsyncData(() => api.get<{ items: PublicCompany[]; demoNotice: string }>('/companies'), []);
  const vacancies = useAsyncData(() => api.get<{ items: Vacancy[] }>('/vacancies'), []);
  const tests = useAsyncData(() => api.get<{ items: TechnicalTest[] }>('/technical-tests'), []);
  const [preview, setPreview] = useState<TechnicalTest | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const items = companies.data?.items || [];
  const vacancyItems = vacancies.data?.items || [];
  const testItems = tests.data?.items || [];
  const openChallenges = items.reduce((sum, company) => sum + company.openChallenges, 0);

  async function openTest(test: TechnicalTest) {
    setPreview(test);
    setPreviewLoading(true);
    try {
      const response = await api.get<{ test: TechnicalTest }>(`/technical-tests/${test.id}`);
      setPreview(response.test);
    } catch (caught) {
      push(caught instanceof ApiError ? caught.message : 'No pudimos cargar la prueba técnica.', 'error');
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-ink-gradient text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_85%_0%,rgba(37,99,235,0.32),transparent_70%),radial-gradient(45%_50%_at_5%_100%,rgba(124,58,237,0.22),transparent_70%)]" aria-hidden="true" />
        <div className="container-page relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-[#c7d2fe]">
              <Sparkle size={13} weight="fill" aria-hidden="true" /> Portal de reclutamiento junior
            </span>
            <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.03] tracking-[-0.045em] text-white sm:text-6xl">
              Publica vacantes y descubre talento <span className="text-[#a5b4fc]">en formación.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-white/65">
              Registra tu empresa, publica empleos o prácticas junior y agrega pruebas técnicas de admisión. Los estudiantes
              exploran las oportunidades desde cualquier navegador.
            </p>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Link to="/registro?rol=empresa" className={buttonStyles('primary', 'lg')}>
                Registrar mi empresa <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <a href="#vacantes" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-6 text-[15px] font-semibold text-white transition hover:bg-white/10 focus-ring">
                Ver vacantes activas
              </a>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-white/50">
              <CheckCircle size={14} className="text-emerald" aria-hidden="true" /> Proyecto de demostración · Sin pagos ni contratación garantizada
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">Empresas demo</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-white">{companies.loading ? '—' : items.length}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/50">Perfiles ficticios etiquetados como ejemplos.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm sm:mt-6">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">Vacantes activas</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-white">{vacancies.loading ? '—' : vacancyItems.length}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/50">Empleos, prácticas y roles junior ficticios.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">Pruebas técnicas</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-white">{tests.loading ? '—' : testItems.length}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/50">Evaluaciones de admisión publicadas.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm sm:mt-6">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">Retos abiertos</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-white">{companies.loading ? '—' : openChallenges}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/50">Desafíos con entregables definidos.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="container-page grid gap-4 py-6 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-electric/8 text-electric"><Handshake size={20} weight="duotone" aria-hidden="true" /></span>
            <div><p className="text-[13px] font-semibold text-ink">Conexión académica</p><p className="text-[11px] text-muted">Retos ligados a materias y habilidades.</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald/10 text-emerald"><ShieldCheck size={20} weight="duotone" aria-hidden="true" /></span>
            <div><p className="text-[13px] font-semibold text-ink">Acceso restringido</p><p className="text-[11px] text-muted">Solo tu empresa ve tus postulaciones.</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-violet/10 text-violet"><UsersThree size={20} weight="duotone" aria-hidden="true" /></span>
            <div><p className="text-[13px] font-semibold text-ink">Perfiles completos</p><p className="text-[11px] text-muted">Carrera, semestre, motivación y entregables.</p></div>
          </div>
        </div>
      </section>

      <section className="section-space bg-paper" aria-labelledby="empresas-title">
        <div className="container-page">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 id="empresas-title" className="text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.4rem]">Empresas del programa</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">Perfiles de demostración con retos publicados. Puedes explorar sus desafíos sin crear una cuenta.</p>
            </div>
            <DemoNotice compact className="max-w-sm">Todas las empresas de esta página son ficticias y se identifican como ejemplos.</DemoNotice>
          </div>

          {companies.loading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <CardSkeleton key={index} />)}</div>
          ) : companies.error ? (
            <div className="mt-8"><ErrorState message={companies.error.message} onRetry={companies.reload} /></div>
          ) : items.length === 0 ? (
            <div className="mt-8"><EmptyState icon={Buildings} title="Aún no hay empresas registradas" description="Cuando se publiquen perfiles de empresa aparecerán en esta sección." /></div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((company) => (
                <article key={company.id} className="surface hover-lift flex h-full flex-col p-5">
                  <div className="flex items-start gap-3">
                    <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold', logoColors[company.logoColor] || logoColors.blue)}>
                      {company.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold text-ink">{company.name}</h3>
                      <p className="text-[11px] text-muted">{company.sector}{company.location ? ` · ${company.location}` : ''}</p>
                      <div className="mt-1.5 flex gap-1">
                        {company.verified && <Badge tone="emerald">Verificada</Badge>}
                        {company.isDemo && <Badge tone="amber">Demo</Badge>}
                      </div>
                    </div>
                  </div>
                  <p className="clamp-3 mt-3 text-[12.5px] leading-relaxed text-muted">{company.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/80 pt-3.5">
                    <Badge tone={company.openChallenges > 0 ? 'blue' : 'slate'}>{company.openChallenges} retos abiertos</Badge>
                    <Link to={`/retos?q=${encodeURIComponent(company.name)}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-electric hover:underline">
                      Ver retos <ArrowRight size={12} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="vacantes" className="section-space scroll-mt-24 bg-white" aria-labelledby="vacantes-title">
        <div className="container-page">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-electric">Oportunidades</span>
              <h2 id="vacantes-title" className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.4rem]">Vacantes y prácticas junior</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                Ofertas ficticias publicadas por las empresas de demostración. Cada tarjeta indica modalidad, ubicación,
                fecha límite y si incluye una prueba técnica.
              </p>
            </div>
            <DemoNotice compact className="max-w-sm">Las vacantes son ejemplos y no representan ofertas laborales reales.</DemoNotice>
          </div>

          {vacancies.loading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => <CardSkeleton key={index} />)}
            </div>
          ) : vacancies.error ? (
            <div className="mt-8"><ErrorState message="No pudimos cargar las vacantes." onRetry={vacancies.reload} /></div>
          ) : vacancyItems.length === 0 ? (
            <div className="mt-8">
              <EmptyState icon={Briefcase} title="Aún no hay vacantes activas" description="Cuando las empresas publiquen sus ofertas aparecerán en esta sección." />
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vacancyItems.map((vacancy) => {
                const remaining = daysUntil(vacancy.deadline);
                return (
                  <article key={vacancy.id} className="surface hover-lift flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold', logoColors[vacancy.company.logoColor] || logoColors.blue)}>
                          {vacancy.company.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium text-muted">{vacancy.company.name}</p>
                          <p className="truncate text-[10px] text-muted/80">{vacancy.company.sector}</p>
                        </div>
                      </div>
                      <Badge tone={vacancy.type === 'practica' ? 'cyan' : vacancy.type === 'junior' ? 'violet' : 'blue'}>
                        {vacancy.type === 'practica' ? 'Práctica' : vacancy.type === 'junior' ? 'Junior' : 'Empleo'}
                      </Badge>
                    </div>
                    <h3 className="mt-4 text-[16px] font-semibold leading-snug text-ink">{vacancy.title}</h3>
                    <p className="clamp-3 mt-2 text-[12.5px] leading-relaxed text-muted">{vacancy.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted">
                      {vacancy.location && <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-1"><MapPin size={11} aria-hidden="true" />{vacancy.location}</span>}
                      {vacancy.modality && <span className="rounded-full bg-paper px-2 py-1 capitalize">{vacancy.modality}</span>}
                      {vacancy.testsCount > 0 && <span className="rounded-full bg-electric/8 px-2 py-1 font-semibold text-electric">{plural(vacancy.testsCount, 'prueba técnica', 'pruebas técnicas')}</span>}
                    </div>
                    <div className="mt-auto flex items-end justify-between gap-2 border-t border-line/80 pt-4">
                      <div>
                        <p className="text-[10px] text-muted">Cierre</p>
                        <p className="text-[11px] font-semibold text-ink-soft">{formatDate(vacancy.deadline)}</p>
                        <p className={cn('mt-0.5 text-[10px]', remaining >= 0 ? 'text-muted' : 'text-rose')}>
                          {remaining >= 0 ? `${remaining} días restantes` : 'Fecha vencida'}
                        </p>
                      </div>
                      {vacancy.salaryRange && <p className="max-w-[10rem] text-right text-[10px] leading-snug text-muted">{vacancy.salaryRange}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="pruebas" className="section-space scroll-mt-24 bg-paper" aria-labelledby="pruebas-title">
        <div className="container-page">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-violet">Admisión</span>
              <h2 id="pruebas-title" className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.4rem]">Pruebas técnicas publicadas</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                Las empresas adjuntan sus evaluaciones a las vacantes. Aquí puedes revisar el temario, la duración y el
                puntaje mínimo antes de presentarla.
              </p>
            </div>
            <DemoNotice compact className="max-w-sm">Las pruebas son ficticias y no otorgan empleo ni certificación.</DemoNotice>
          </div>

          {tests.loading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => <CardSkeleton key={index} />)}
            </div>
          ) : tests.error ? (
            <div className="mt-8"><ErrorState message="No pudimos cargar las pruebas técnicas." onRetry={tests.reload} /></div>
          ) : testItems.length === 0 ? (
            <div className="mt-8">
              <EmptyState icon={ClipboardText} title="Aún no hay pruebas publicadas" description="Las empresas pueden crear pruebas desde su panel y vincularlas a una vacante." />
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testItems.map((test) => (
                <article key={test.id} className="surface flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-violet/10 text-violet">
                      <ClipboardText size={20} weight="duotone" aria-hidden="true" />
                    </span>
                    <Badge tone="violet">Prueba técnica</Badge>
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold leading-snug text-ink">{test.title}</h3>
                  <p className="mt-1 text-[11px] text-muted">{test.company.name}</p>
                  <p className="clamp-2 mt-2 text-[12px] leading-relaxed text-muted">{test.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted">
                    <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-1"><Clock size={11} aria-hidden="true" />{test.durationMinutes} min</span>
                    <span className="rounded-full bg-paper px-2 py-1">Mínimo {test.passingScore}%</span>
                    <span className="rounded-full bg-paper px-2 py-1">{plural(test.questionCount, 'pregunta', 'preguntas')}</span>
                  </div>
                  {test.vacancy?.title && (
                    <p className="mt-3 line-clamp-1 text-[10px] text-muted">Vinculada a: <span className="font-medium text-ink-soft">{test.vacancy.title}</span></p>
                  )}
                  <Button variant="secondary" size="sm" className="mt-auto w-full" onClick={() => openTest(test)}>
                    Ver temario
                    {previewLoading && preview?.id === test.id ? '…' : null}
                  </Button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-space bg-white" aria-labelledby="beneficios-title">
        <div className="container-page">
          <div className="max-w-2xl">
            <h2 id="beneficios-title" className="text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2.4rem]">Una forma concreta de conocer talento</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">Sin promesas infladas: la plataforma facilita el encuentro, tú decides cómo usarlo.</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="surface h-full p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-electric/8 text-electric"><benefit.icon size={20} weight="duotone" aria-hidden="true" /></span>
                <h3 className="mt-4 text-[14px] font-semibold text-ink">{benefit.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-paper">
        <div className="container-page py-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">De la publicación a la revisión</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Tres pasos, con control en cada etapa. La empresa conserva la decisión final.</p>
              <Link to="/registro?rol=empresa" className={buttonStyles('primary', 'md', 'mt-5')}>Crear cuenta de empresa <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
            <div className="grid gap-3">
              {steps.map((step, index) => (
                <div key={step.title} className="flex items-start gap-4 rounded-2xl border border-line bg-white p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric/8 text-electric"><step.icon size={20} weight="duotone" aria-hidden="true" /></span>
                  <div>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">Paso {index + 1}</p>
                    <h3 className="mt-0.5 text-[14px] font-semibold text-ink">{step.title}</h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-space bg-white">
        <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-ink">Preguntas frecuentes</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Lo que debes saber antes de publicar un reto en la demostración.</p>
            <StatCard label="Transparencia" value="Demo" hint="Empresas y retos ficticios, claramente etiquetados." icon={<ShieldCheck size={18} />} tone="emerald" />
          </div>
          <Accordion items={faqs} />
        </div>
      </section>

      <section className="container-page pb-14">
        <div className="overflow-hidden rounded-3xl bg-ink-gradient p-7 text-white sm:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">¿Listo para publicar tu primera vacante?</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">Crea la cuenta de empresa, completa el perfil y publica una vacante con su prueba técnica de admisión.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/registro?rol=empresa" className={buttonStyles('primary', 'md')}>Comenzar ahora</Link>
              <a href="#vacantes" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-ring">Ver vacantes</a>
            </div>
          </div>
        </div>
      </section>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.title || 'Prueba técnica'}
        description={preview ? `${preview.company.name} · ${preview.durationMinutes} minutos · Puntaje mínimo ${preview.passingScore}%` : undefined}
        size="lg"
        footer={<Button variant="secondary" size="sm" onClick={() => setPreview(null)}>Cerrar</Button>}
      >
        {preview && (
          <div>
            <div className="rounded-xl border border-line bg-paper/70 p-3 text-sm leading-relaxed text-muted">
              {preview.description}
            </div>
            {preview.instructions && (
              <div className="mt-3 rounded-xl border border-amber/20 bg-amber/[0.055] p-3 text-xs leading-relaxed text-amber">
                <span className="font-semibold">Instrucciones:</span> {preview.instructions}
              </div>
            )}
            {previewLoading ? (
              <div className="py-8"><PageLoader label="Cargando preguntas…" /></div>
            ) : preview.questions && preview.questions.length > 0 ? (
              <div className="mt-5 space-y-4">
                {preview.questions.map((question, index) => (
                  <div key={`${question.prompt}-${index}`} className="rounded-xl border border-line p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Pregunta {index + 1} · {question.type === 'multiple' ? 'Opción múltiple' : 'Respuesta abierta'}</p>
                    <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink">{question.prompt}</p>
                    {question.options.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {question.options.map((option) => (
                          <li key={option} className="rounded-lg border border-line bg-white px-3 py-2 text-xs text-ink-soft">{option}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                <p className="text-[11px] leading-relaxed text-muted">
                  Las respuestas correctas no se muestran en la vista pública. Esta prueba es un ejemplo de demostración.
                </p>
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted">Las preguntas se cargarán cuando la prueba esté disponible.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
