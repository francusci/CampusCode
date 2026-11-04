import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Books,
  Buildings,
  ChartLineUp,
  Code,
  Flag,
  GraduationCap,
  Robot,
  Trophy,
  Users,
  UsersThree,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { DemoNotice } from '@/components/common/DemoNotice';
import { activityLabels, formatDate, relativeTime, roleLabels } from '@/lib/format';
import { buttonStyles } from '@/components/ui/Button';
import type { AdminOverview } from '@/lib/types';

const reportTargets: Record<string, { label: string; to: string }> = {
  exercise: { label: 'Ejercicio', to: '/admin/ejercicios' },
  challenge: { label: 'Reto', to: '/admin/retos' },
  user: { label: 'Usuario', to: '/admin/usuarios' },
};

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsyncData(() => api.get<AdminOverview>('/admin/overview'), []);

  if (loading) return <PageLoader label="Cargando administración…" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data) return null;

  const { counts, recentUsers, reports, recentActivity } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administración"
        description="Estado del catálogo, las cuentas y los reportes de la plataforma. Las acciones sensibles quedan registradas y se validan en el servidor."
        actions={
          <>
            <Link to="/admin/usuarios" className={buttonStyles('secondary', 'md')}>Usuarios</Link>
            <Link to="/admin/reportes" className={buttonStyles('primary', 'md')}>Ver reportes</Link>
          </>
        }
      />

      <DemoNotice>
        Esta instalación parte de un catálogo de demostración. Los conteos reflejan exclusivamente la base de datos local; no son métricas reales de uso ni de estudiantes.
      </DemoNotice>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores de la plataforma">
        <StatCard label="Usuarios" value={counts.users} hint={`${counts.students} estudiantes · ${counts.companies} empresas`} icon={<Users size={18} />} />
        <StatCard label="Ejercicios" value={counts.exercises} hint={`${counts.subjects} materias · ${counts.careers} carreras`} icon={<Code size={18} />} tone="violet" />
        <StatCard label="Retos" value={counts.challenges} hint={`${counts.open_challenges} abiertos`} icon={<Trophy size={18} />} tone="emerald" />
        <StatCard label="Reportes abiertos" value={counts.open_reports} hint="Pendientes de revisión" icon={<Flag size={18} />} tone="amber" />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Actividad de la plataforma">
        <StatCard label="Postulaciones" value={counts.applications} hint="A retos de empresas" icon={<UsersThree size={18} />} tone="violet" />
        <StatCard label="Conversaciones IA" value={counts.conversations} hint="Historial guardado" icon={<Robot size={18} />} />
        <StatCard label="Carreras" value={counts.careers} hint="Catálogo académico" icon={<GraduationCap size={18} />} tone="emerald" />
        <StatCard label="Materias" value={counts.subjects} hint="Publicadas y en borrador" icon={<Books size={18} />} tone="amber" />
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="surface p-5 sm:p-6" aria-labelledby="usuarios-recientes-title">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="usuarios-recientes-title" className="text-sm font-semibold text-ink">Usuarios recientes</h2>
              <p className="mt-0.5 text-[11px] text-muted">Últimas cuentas creadas en la base local.</p>
            </div>
            <Link to="/admin/usuarios" className="text-[11px] font-semibold text-electric hover:underline">Gestionar</Link>
          </div>
          {recentUsers.length === 0 ? (
            <div className="mt-4"><EmptyState icon={Users} title="Sin usuarios" description="Aún no hay cuentas registradas." /></div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line text-[9.5px] uppercase tracking-[0.12em] text-muted">
                    <th className="py-2 pr-3 font-semibold">Cuenta</th>
                    <th className="px-3 py-2 font-semibold">Rol</th>
                    <th className="px-3 py-2 font-semibold">Estado</th>
                    <th className="py-2 pl-3 text-right font-semibold">Alta</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-line/70 last:border-0">
                      <td className="py-2.5 pr-3">
                        <p className="text-[12px] font-medium text-ink">{user.full_name}</p>
                        <p className="truncate text-[10.5px] text-muted">{user.email}</p>
                      </td>
                      <td className="px-3 py-2.5"><Badge tone={user.role === 'admin' ? 'violet' : user.role === 'company' ? 'cyan' : 'blue'}>{roleLabels[user.role]}</Badge></td>
                      <td className="px-3 py-2.5">
                        <Badge tone={user.is_active ? 'emerald' : 'rose'}>{user.is_active ? 'Activa' : 'Inactiva'}</Badge>
                      </td>
                      <td className="py-2.5 pl-3 text-right text-[10.5px] text-muted">{formatDate(user.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="surface p-5 sm:p-6" aria-labelledby="reportes-title">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="reportes-title" className="text-sm font-semibold text-ink">Reportes recientes</h2>
              <p className="mt-0.5 text-[11px] text-muted">Contenido señalado por la comunidad.</p>
            </div>
            <Link to="/admin/reportes" className="text-[11px] font-semibold text-electric hover:underline">Ver todos</Link>
          </div>
          {reports.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line bg-paper/50 px-4 py-8 text-center text-xs text-muted">
              No hay reportes registrados. Cuando existan, aparecerán aquí para su revisión.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {reports.map((report) => {
                const target = reportTargets[report.target_type] || { label: report.target_type, to: '/admin/reportes' };
                return (
                  <li key={report.id} className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[11.5px] leading-relaxed text-ink">{report.reason}</p>
                        <p className="mt-1 text-[10px] text-muted">
                          {report.reporter_name || 'Usuario eliminado'} · {target.label} · {relativeTime(report.created_at)}
                        </p>
                      </div>
                      <Badge tone={report.status === 'open' ? 'amber' : report.status === 'reviewed' ? 'emerald' : 'slate'}>
                        {report.status === 'open' ? 'Abierto' : report.status === 'reviewed' ? 'Revisado' : 'Descartado'}
                      </Badge>
                    </div>
                    <Link to={target.to} className="mt-1.5 inline-flex items-center gap-1 rounded text-[10px] font-semibold text-electric hover:underline focus-ring">
                      Ir a {target.label.toLowerCase()} <ArrowRight size={10} aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="surface p-5 sm:p-6" aria-labelledby="actividad-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="actividad-title" className="text-sm font-semibold text-ink">Actividad reciente</h2>
            <p className="mt-0.5 text-[11px] text-muted">Eventos registrados por las cuentas de la plataforma.</p>
          </div>
          <Badge tone="slate">Registro local</Badge>
        </div>
        {recentActivity.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-paper/50 px-4 py-8 text-center text-xs text-muted">Sin actividad registrada todavía.</p>
        ) : (
          <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {recentActivity.map((item, index) => (
              <li key={`${item.created_at}-${index}`} className="flex items-start gap-2.5 rounded-xl border border-line bg-paper/35 px-3 py-2.5">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-electric" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[11.5px] font-medium text-ink">
                    {item.full_name} <span className="font-normal text-muted">{activityLabels[item.type] || item.type.replaceAll('_', ' ')}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">{relativeTime(item.created_at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Users, title: 'Cuentas y roles', text: 'Activa, desactiva o cambia el rol con validaciones del servidor.', to: '/admin/usuarios', label: 'Gestionar usuarios' },
          { icon: ChartLineUp, title: 'Catálogo académico', text: 'Crea carreras y materias, y controla su publicación.', to: '/admin/materias', label: 'Editar catálogo' },
          { icon: Buildings, title: 'Retos de empresas', text: 'Modera estados y destaca desafíos del catálogo.', to: '/admin/retos', label: 'Revisar retos' },
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
    </div>
  );
}
