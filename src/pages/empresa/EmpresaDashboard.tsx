import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Buildings,
  CheckCircle,
  ClipboardText,
  Clock,
  FileText,
  Plus,
  Trophy,
  UsersThree,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { DemoNotice } from '@/components/common/DemoNotice';
import { buttonStyles } from '@/components/ui/Button';
import { applicationStatusClass, applicationStatusLabels, formatDate, relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { CompanyOverview } from '@/lib/types';

const statusTone = {
  open: 'emerald',
  draft: 'amber',
  closed: 'slate',
} as const;

export default function EmpresaDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsyncData(() => api.get<CompanyOverview>('/company/overview'), []);

  if (loading) return <PageLoader label="Cargando panel empresarial…" />;
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorState message={error.message} onRetry={reload} />
        <p className="text-center text-xs text-muted">Si tu cuenta no tiene perfil empresarial, contacta a la administración o vuelve a crear la cuenta de empresa.</p>
      </div>
    );
  }
  if (!data) return null;

  const { company, stats, challenges, recentApplications } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        description="Publica vacantes, agrega pruebas técnicas de admisión y administra tus retos y postulaciones. Solo tu empresa accede a esta información."
        actions={
          <>
            <Link to="/empresa/vacantes/nuevo" className={buttonStyles('primary', 'md')}><Plus size={15} aria-hidden="true" /> Nueva vacante</Link>
            <Link to="/empresa/pruebas/nuevo" className={buttonStyles('secondary', 'md')}><ClipboardText size={15} aria-hidden="true" /> Nueva prueba</Link>
            <Link to="/empresa/retos/nuevo" className={buttonStyles('secondary', 'md')}>Nuevo reto</Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="slate">{company.sector}</Badge>
        {company.verified && <Badge tone="emerald">Verificada</Badge>}
        {company.isDemo && <Badge tone="amber">Empresa de demostración</Badge>}
        {company.location && <span className="text-[11px] text-muted">{company.location}</span>}
      </div>

      {company.isDemo && (
        <DemoNotice>
          Esta empresa es ficticia y forma parte del catálogo de demostración. Las vacantes, pruebas técnicas, retos y postulaciones asociados también son ejemplos.
        </DemoNotice>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Resumen de la empresa">
        <StatCard label="Retos abiertos" value={stats.openChallenges} hint="Visibles para estudiantes" icon={<Trophy size={18} />} tone="emerald" />
        <StatCard label="Borradores" value={stats.draftChallenges} hint="Sin publicar todavía" icon={<FileText size={18} />} tone="amber" />
        <StatCard label="Postulaciones" value={stats.applications} hint="Histórico de tus retos" icon={<UsersThree size={18} />} />
        <StatCard label="Nuevas" value={stats.newApplications} hint="Estado enviada, sin revisar" icon={<Clock size={18} />} tone="violet" />
        <StatCard label="Aceptadas" value={stats.accepted} hint="Estudiantes seleccionados" icon={<CheckCircle size={18} />} tone="emerald" />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Resumen de reclutamiento">
        <StatCard label="Vacantes publicadas" value={stats.openVacancies} hint={`${stats.totalVacancies} en total, incluyendo borradores`} icon={<Briefcase size={18} />} tone="emerald" />
        <StatCard label="Pruebas publicadas" value={stats.publishedTests} hint={`${stats.totalTests} en total, incluyendo borradores`} icon={<ClipboardText size={18} />} tone="violet" />
        <Link to="/empresa/vacantes" className="surface hover-lift flex items-center justify-between gap-3 p-5 focus-ring">
          <span>
            <span className="block text-[13px] font-semibold text-ink">Gestionar reclutamiento</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-muted">Vacantes, pruebas técnicas y postulaciones.</span>
          </span>
          <ArrowRight size={18} className="shrink-0 text-electric" aria-hidden="true" />
        </Link>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="surface p-5 sm:p-6" aria-labelledby="retos-empresa-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="retos-empresa-title" className="text-sm font-semibold text-ink">Tus retos</h2>
              <p className="mt-0.5 text-[11px] text-muted">Gestiona el estado, revisa postulaciones y edita el contenido.</p>
            </div>
            <Link to="/empresa/retos" className="text-[11px] font-semibold text-electric hover:underline">Gestionar todos</Link>
          </div>

          {challenges.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Briefcase}
                title="Aún no has publicado retos"
                description="Crea tu primer desafío con contexto, requisitos y entregables. Puedes guardarlo como borrador antes de publicarlo."
                action={<Link to="/empresa/retos/nuevo" className={buttonStyles('primary', 'sm')}>Crear primer reto</Link>}
              />
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line text-[9.5px] uppercase tracking-[0.12em] text-muted">
                    <th className="py-2 pr-3 font-semibold">Reto</th>
                    <th className="px-3 py-2 font-semibold">Estado</th>
                    <th className="px-3 py-2 font-semibold">Postulaciones</th>
                    <th className="px-3 py-2 font-semibold">Límite</th>
                    <th className="py-2 pl-3 text-right font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.slice(0, 6).map((challenge) => (
                    <tr key={challenge.id} className="border-b border-line/70 last:border-0">
                      <td className="max-w-[230px] py-3 pr-3">
                        <Link to={`/empresa/retos/${challenge.id}`} className="block truncate text-[12.5px] font-medium text-ink transition hover:text-electric focus-ring">{challenge.title}</Link>
                        <span className="text-[10px] text-muted">{challenge.category}</span>
                      </td>
                      <td className="px-3 py-3"><Badge tone={statusTone[challenge.status]}>{challenge.status === 'open' ? 'Abierto' : challenge.status === 'draft' ? 'Borrador' : 'Cerrado'}</Badge></td>
                      <td className="px-3 py-3">
                        <span className="text-[12px] font-semibold text-ink">{challenge.applicationsCount}</span>
                        {challenge.newApplications > 0 && <span className="ml-1 text-[10px] text-electric">{challenge.newApplications} nuevas</span>}
                      </td>
                      <td className="px-3 py-3 text-[11px] text-muted">{formatDate(challenge.deadline)}</td>
                      <td className="py-3 pl-3 text-right"><Link to={`/empresa/retos/${challenge.id}`} className="inline-flex rounded p-1 text-muted hover:text-electric focus-ring" aria-label={`Editar ${challenge.title}`}><ArrowRight size={14} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="surface p-5 sm:p-6" aria-labelledby="postulaciones-recientes-title">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="postulaciones-recientes-title" className="text-sm font-semibold text-ink">Postulaciones recientes</h2>
              <p className="mt-0.5 text-[11px] text-muted">Últimos movimientos de estudiantes.</p>
            </div>
            <Link to="/empresa/postulaciones" className="text-[11px] font-semibold text-electric hover:underline">Ver todas</Link>
          </div>

          {recentApplications.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line-strong bg-paper/50 px-4 py-8 text-center text-xs text-muted">Aún no hay postulaciones. Publica un reto para empezar a recibirlas.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recentApplications.map((application) => (
                <li key={application.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-ink">{application.student.name}</p>
                      <p className="truncate text-[10.5px] text-muted">{application.challenge?.title || 'Reto'}</p>
                      <p className="mt-0.5 text-[10px] text-muted">{application.student.careerName || 'Sin carrera'} · {relativeTime(application.createdAt)}</p>
                    </div>
                    <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] font-semibold', applicationStatusClass[application.status])}>{applicationStatusLabels[application.status]}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/empresa/postulaciones" className={buttonStyles('secondary', 'sm', 'mt-3 w-full')}>Revisar postulaciones</Link>
        </section>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Briefcase, title: 'Publica una vacante', text: 'Empleo, práctica o rol junior con contexto.', to: '/empresa/vacantes/nuevo', label: 'Nueva vacante' },
          { icon: ClipboardText, title: 'Agrega una prueba', text: 'Preguntas, duración y puntaje de admisión.', to: '/empresa/pruebas/nuevo', label: 'Nueva prueba' },
          { icon: UsersThree, title: 'Revisa postulaciones', text: 'Consulta perfiles, mensajes y enlaces.', to: '/empresa/postulaciones', label: 'Abrir bandeja' },
          { icon: Plus, title: 'Publica un reto', text: 'Define problema, requisitos y entregables.', to: '/empresa/retos/nuevo', label: 'Nuevo reto' },
          { icon: Buildings, title: 'Completa tu perfil', text: 'Sector, descripción, ubicación y sitio web.', to: '/empresa/perfil', label: 'Editar perfil' },
        ].map((item) => (
          <Link key={item.title} to={item.to} className="surface hover-lift group flex items-start gap-3 p-5 focus-ring">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric/8 text-electric"><item.icon size={19} weight="duotone" aria-hidden="true" /></span>
            <span>
              <span className="block text-[13px] font-semibold text-ink group-hover:text-electric">{item.title}</span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{item.text}</span>
              <span className="mt-1.5 inline-block text-[10.5px] font-semibold text-electric">{item.label} →</span>
            </span>
          </Link>
        ))}
      </section>

      <p className="text-[10px] text-muted">Sesión de empresa: {user?.email}. Los permisos se comprueban en el servidor para cada operación.</p>
    </div>
  );
}
