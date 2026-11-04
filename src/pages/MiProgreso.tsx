import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarBlank,
  ChartLineUp,
  CheckCircle,
  Clock,
  Fire,
  Flag,
  Plus,
  Target,
  Trash,
  Trophy,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Field';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ActivityFeed } from '@/components/common/ActivityFeed';
import { ProgressChart } from '@/components/common/ProgressChart';
import { DemoNotice } from '@/components/common/DemoNotice';
import { formatDate, plural } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Goal, ProgressData, SubjectSummary } from '@/lib/types';

interface GoalForm {
  title: string;
  targetCount: string;
  dueDate: string;
  subjectId: string;
}

const emptyForm: GoalForm = { title: '', targetCount: '5', dueDate: '', subjectId: '' };

export default function MiProgreso() {
  const toast = useToast();
  const progress = useAsyncData(() => api.get<ProgressData>('/me/progress'), []);
  const subjects = useAsyncData(() => api.get<{ items: SubjectSummary[] }>('/subjects'), []);
  const [goalOpen, setGoalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusBusy, setStatusBusy] = useState<string | null>(null);

  if (progress.loading) return <PageLoader label="Calculando tu progreso…" />;
  if (progress.error) return <ErrorState message={progress.error.message} onRetry={progress.reload} />;
  if (!progress.data) return null;

  const data = progress.data;
  const overall = data.totals.available ? Math.round((data.totals.completed / data.totals.available) * 100) : 0;
  const completedGoals = data.goals.filter((goal) => goal.status === 'completed');

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setGoalOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditing(goal);
    setForm({
      title: goal.title,
      targetCount: String(goal.targetCount),
      dueDate: goal.dueDate || '',
      subjectId: goal.subjectId || '',
    });
    setGoalOpen(true);
  }

  async function saveGoal() {
    const title = form.title.trim();
    const targetCount = Number(form.targetCount);
    if (title.length < 4) return toast.error('El título debe tener al menos 4 caracteres.');
    if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > 200) return toast.error('La meta debe ser un entero entre 1 y 200.');
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/me/goals/${editing.id}`, { title, targetCount, dueDate: form.dueDate || null });
        toast.success('Objetivo actualizado.');
      } else {
        await api.post('/me/goals', { title, targetCount, dueDate: form.dueDate || null, subjectId: form.subjectId || null });
        toast.success('Objetivo creado.');
      }
      setGoalOpen(false);
      progress.reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos guardar el objetivo.');
    } finally {
      setSaving(false);
    }
  }

  async function changeGoalStatus(goal: Goal, status: 'completed' | 'archived') {
    setStatusBusy(goal.id);
    try {
      await api.patch(`/me/goals/${goal.id}`, { status });
      toast.success(status === 'completed' ? 'Objetivo marcado como logrado.' : 'Objetivo archivado.');
      progress.reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar el objetivo.');
    } finally {
      setStatusBusy(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/me/goals/${deleteTarget.id}`);
      toast.success('Objetivo eliminado.');
      setDeleteTarget(null);
      progress.reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos eliminar el objetivo.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi progreso"
        description="Cada cifra sale de tu actividad registrada: ejercicios completados, intentos, favoritos y postulaciones. Sin estimaciones decorativas."
        actions={
          <>
            <Button onClick={openCreate} icon={<Plus size={15} />}>Nuevo objetivo</Button>
            <Link to="/ejercicios" className={buttonStyles('secondary', 'md')}>Practicar</Link>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Totales de progreso">
        <StatCard label="Completados" value={data.totals.completed} hint={`de ${data.totals.available} ejercicios`} icon={<CheckCircle size={18} />} tone="emerald" />
        <StatCard label="En curso" value={data.totals.inProgress} hint="Intentos sin completar" icon={<Clock size={18} />} tone="amber" />
        <StatCard label="Días de estudio" value={data.totals.studyDays} hint="Días con ejercicios completados" icon={<Fire size={18} />} tone="violet" />
        <StatCard label="Favoritos" value={data.totals.favorites} hint="Ejercicios guardados" icon={<Flag size={18} />} />
        <StatCard label="Postulaciones" value={data.totals.applications} hint="Retos activos o en revisión" icon={<Trophy size={18} />} tone="violet" />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="surface p-5 sm:p-6" aria-labelledby="evolucion-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="evolucion-title" className="text-sm font-semibold text-ink">Evolución de los últimos 30 días</h2>
              <p className="mt-0.5 text-[11px] text-muted">Ejercicios completados por día, según el historial de actividad.</p>
            </div>
            <Badge tone="slate">Datos reales de tu cuenta</Badge>
          </div>
          <div className="mt-5"><ProgressChart series={data.series} height={150} /></div>
        </section>

        <aside className="surface flex flex-col justify-center p-5" aria-labelledby="avance-title">
          <h2 id="avance-title" className="text-sm font-semibold text-ink">Avance global</h2>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-semibold tracking-[-0.05em] text-ink">{overall}%</span>
            <span className="mb-1.5 text-[11px] text-muted">del catálogo</span>
          </div>
          <ProgressBar value={overall} size="lg" className="mt-3" label="Avance global del catálogo" />
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
            Has completado {data.totals.completed} de {data.totals.available} ejercicios publicados. El porcentaje se recalcula con cada intento.
          </p>
          <div className="mt-4 border-t border-line pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Dificultad</p>
            <div className="mt-2.5 space-y-2.5">
              {data.difficulties.map((item) => (
                <div key={item.difficulty}>
                  <div className="mb-1 flex justify-between text-[10.5px]"><span className="capitalize text-ink-soft">{item.difficulty === 'basico' ? 'Básico' : item.difficulty}</span><span className="text-muted">{item.completed}/{item.total}</span></div>
                  <ProgressBar value={item.percent} size="sm" tone={item.difficulty === 'basico' ? 'emerald' : item.difficulty === 'intermedio' ? 'amber' : 'violet'} label={`Progreso en dificultad ${item.difficulty}`} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <section className="surface p-5 sm:p-6" aria-labelledby="objetivos-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="objetivos-title" className="text-sm font-semibold text-ink">Objetivos de estudio</h2>
            <p className="mt-0.5 text-[11px] text-muted">Metas medibles desde la fecha de creación. Un objetivo no altera tu progreso, lo hace visible.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={openCreate} icon={<Plus size={14} />}>Agregar objetivo</Button>
        </div>

        {data.goals.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Target}
              title="Todavía no tienes objetivos"
              description="Crea una meta concreta, por ejemplo “completar 10 ejercicios de Programación I este mes”. El avance se calcula automáticamente."
              action={<Button size="sm" onClick={openCreate}>Crear mi primer objetivo</Button>}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.goals.map((goal) => (
              <article key={goal.id} className={cn('rounded-2xl border p-4', goal.status === 'completed' ? 'border-emerald/20 bg-emerald/[0.035]' : 'border-line bg-white')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">{goal.title}</p>
                    <p className="mt-0.5 text-[10.5px] text-muted">
                      {goal.current} de {goal.targetCount} ejercicios{goal.subjectName ? ` · ${goal.subjectName}` : ''}
                    </p>
                  </div>
                  <Badge tone={goal.status === 'completed' ? 'emerald' : 'blue'}>{goal.status === 'completed' ? 'Logrado' : 'Activo'}</Badge>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[10px] text-muted"><span>{goal.percent}%</span>{goal.dueDate && <span className="flex items-center gap-1"><CalendarBlank size={10} aria-hidden="true" /> {formatDate(goal.dueDate)}</span>}</div>
                  <ProgressBar value={goal.percent} tone={goal.status === 'completed' ? 'emerald' : 'blue'} size="sm" label={`Progreso del objetivo ${goal.title}`} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {goal.status === 'active' && (
                    <button type="button" onClick={() => changeGoalStatus(goal, 'completed')} disabled={statusBusy === goal.id} className="rounded text-[10.5px] font-semibold text-emerald hover:underline focus-ring disabled:opacity-50">Marcar logrado</button>
                  )}
                  <button type="button" onClick={() => openEdit(goal)} className="rounded text-[10.5px] font-semibold text-electric hover:underline focus-ring">Editar</button>
                  <button type="button" onClick={() => changeGoalStatus(goal, 'archived')} disabled={statusBusy === goal.id} className="rounded text-[10.5px] font-medium text-muted hover:text-ink focus-ring disabled:opacity-50">Archivar</button>
                  <button type="button" onClick={() => setDeleteTarget(goal)} className="ml-auto inline-flex items-center gap-1 rounded text-[10.5px] font-medium text-rose hover:underline focus-ring"><Trash size={11} aria-hidden="true" /> Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        )}
        {completedGoals.length > 0 && (
          <p className="mt-3 text-[10.5px] text-muted">Has logrado {plural(completedGoals.length, 'objetivo', 'objetivos')} en esta cuenta.</p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="surface p-5 sm:p-6" aria-labelledby="materias-progreso-title">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="materias-progreso-title" className="text-sm font-semibold text-ink">Progreso por materia</h2>
              <p className="mt-0.5 text-[11px] text-muted">Todas las materias del catálogo, ordenadas por ejercicios completados.</p>
            </div>
            <Link to="/catalogo" className="text-[11px] font-semibold text-electric hover:underline">Catálogo</Link>
          </div>
          <div className="mt-3 divide-y divide-line">
            {data.subjects.map((subject) => (
              <div key={subject.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 sm:w-[42%]">
                  <Link to={`/catalogo/${subject.id}`} className="block truncate text-[12.5px] font-medium text-ink transition hover:text-electric focus-ring">{subject.name}</Link>
                  <p className="text-[10px] text-muted">{subject.careerName}</p>
                </div>
                <div className="flex flex-1 items-center gap-3">
                  <ProgressBar value={subject.percent} size="sm" tone={subject.percent >= 70 ? 'emerald' : subject.percent >= 35 ? 'blue' : 'amber'} label={`Progreso en ${subject.name}`} />
                  <span className="w-16 shrink-0 text-right font-mono text-[10px] text-muted">{subject.completed}/{subject.total}</span>
                  <Link to={`/ejercicios?subject=${subject.id}`} className="shrink-0 rounded p-1 text-muted transition hover:text-electric focus-ring" aria-label={`Practicar ${subject.name}`}><ArrowRight size={14} /></Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Trophy size={16} className="text-emerald" aria-hidden="true" /> Fortalezas</h2>
            {data.strengths.length === 0 ? (
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">Aún no hay suficientes datos. Completa ejercicios en una materia para identificar tus fortalezas.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.strengths.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-emerald/[0.05] px-2.5 py-2">
                    <span className="truncate text-[11.5px] text-ink-soft">{item.name}</span>
                    <span className="font-mono text-[10px] text-emerald">{item.percent}%</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><ChartLineUp size={16} className="text-amber" aria-hidden="true" /> Para practicar</h2>
            {data.needsPractice.length === 0 ? (
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">Cuando tengas materias con avance parcial aparecerán aquí.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.needsPractice.map((item) => (
                  <li key={item.id}>
                    <Link to={`/ejercicios?subject=${item.id}`} className="flex items-center justify-between gap-2 rounded-lg bg-amber/[0.06] px-2.5 py-2 transition hover:bg-amber/10 focus-ring">
                      <span className="min-w-0">
                        <span className="block truncate text-[11.5px] text-ink-soft">{item.name}</span>
                        <span className="block text-[9.5px] text-muted">{item.completed} de {item.total} completados</span>
                      </span>
                      <ArrowRight size={12} className="shrink-0 text-amber" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface p-5">
            <h2 className="text-sm font-semibold text-ink">Actividad reciente</h2>
            <div className="mt-3"><ActivityFeed items={data.recent.slice(0, 8)} emptyLabel="Aún no hay actividad en tu cuenta." /></div>
          </section>

          <DemoNotice compact>
            El progreso pertenece a tu cuenta de demostración y no se comparte con empresas sin una postulación.
          </DemoNotice>
        </aside>
      </div>

      <Modal
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        title={editing ? 'Editar objetivo' : 'Nuevo objetivo'}
        description={editing ? 'Ajusta el título, la meta o la fecha. El avance se calcula desde la actividad registrada.' : 'Define una meta medible. El sistema contará los ejercicios completados desde ahora.'}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setGoalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button size="sm" onClick={saveGoal} loading={saving}>{editing ? 'Guardar cambios' : 'Crear objetivo'}</Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label htmlFor="goal-title" className="mb-1.5 block text-[13px] font-semibold text-ink">Título</label>
            <Input id="goal-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={120} placeholder="Ejemplo: completar 10 ejercicios de Programación I" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="goal-target" className="mb-1.5 block text-[13px] font-semibold text-ink">Meta de ejercicios</label>
              <Input id="goal-target" type="number" min={1} max={200} value={form.targetCount} onChange={(event) => setForm({ ...form, targetCount: event.target.value })} />
            </div>
            <div>
              <label htmlFor="goal-date" className="mb-1.5 block text-[13px] font-semibold text-ink">Fecha límite (opcional)</label>
              <Input id="goal-date" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
            </div>
          </div>
          {!editing && (
            <div>
              <label htmlFor="goal-subject" className="mb-1.5 block text-[13px] font-semibold text-ink">Materia (opcional)</label>
              <Select id="goal-subject" value={form.subjectId} onChange={(event) => setForm({ ...form, subjectId: event.target.value })}>
                <option value="">Cualquier materia</option>
                {(subjects.data?.items || []).map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </Select>
              <p className="mt-1 text-[10.5px] text-muted">Si eliges una materia, solo cuentan los ejercicios de esa materia.</p>
            </div>
          )}
          {editing && <p className="rounded-lg bg-paper px-3 py-2 text-[10.5px] leading-relaxed text-muted">La materia de un objetivo no se puede cambiar después de crearlo. Puedes archivarlo y crear uno nuevo.</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Eliminar objetivo"
        description={`Se eliminará “${deleteTarget?.title || ''}” de forma permanente. El progreso de los ejercicios no se borra.`}
        confirmLabel="Eliminar objetivo"
        loading={deleting}
      />
    </div>
  );
}
