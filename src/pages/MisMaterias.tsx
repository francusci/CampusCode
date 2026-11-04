import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Books,
  BookOpen,
  GraduationCap,
  Plus,
  Sparkle,
  Trash,
} from '@phosphor-icons/react';
import { api, ApiError } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { CardSkeleton } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';
import type { Career, MySubject, SubjectSummary } from '@/lib/types';
import { cn } from '@/lib/cn';

const colorTone: Record<string, 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan'> = {
  blue: 'blue',
  indigo: 'blue',
  violet: 'violet',
  cyan: 'cyan',
  emerald: 'emerald',
  amber: 'amber',
  rose: 'rose',
};

export default function MisMaterias() {
  const { push } = useToast();
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<{ items: MySubject[] }>('/my-subjects'),
    [],
  );
  const careers = useAsyncData(() => api.get<{ items: Career[] }>('/careers'), []);
  const subjects = useAsyncData(() => api.get<{ items: SubjectSummary[] }>('/subjects'), []);

  const [open, setOpen] = useState(false);
  const [careerId, setCareerId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [semester, setSemester] = useState('');
  const [credits, setCredits] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<MySubject | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const items = data?.items ?? [];
  const filteredSubjects = useMemo(
    () => (subjects.data?.items ?? []).filter((subject) => subject.career.id === careerId),
    [subjects.data, careerId],
  );
  const selectedSubject = filteredSubjects.find((subject) => subject.id === subjectId) ?? null;
  const totalCredits = items.reduce((total, item) => total + (item.credits || 0), 0);

  function openModal() {
    setFormError(null);
    setCareerId('');
    setSubjectId('');
    setSemester('');
    setCredits('');
    setOpen(true);
  }

  function handleCareerChange(value: string) {
    setCareerId(value);
    setSubjectId('');
    setSemester('');
    setCredits('');
  }

  function handleSubjectChange(value: string) {
    setSubjectId(value);
    const subject = (subjects.data?.items ?? []).find((item) => item.id === value);
    setSemester(subject?.semester ? String(subject.semester) : '');
    setCredits(subject?.credits ? String(subject.credits) : '');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subjectId) {
      setFormError('Selecciona una materia de la carrera.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const response = await api.post<{ message: string }>('/my-subjects', {
        subjectId,
        semester: semester || undefined,
        credits: credits || undefined,
      });
      push(response.message || 'Materia agregada.', 'success');
      setOpen(false);
      reload();
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'No pudimos agregar la materia.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const response = await api.delete<{ message: string }>(`/my-subjects/${deleting.id}`);
      push(response.message || 'Materia eliminada.', 'success');
      setDeleting(null);
      reload();
    } catch (caught) {
      push(caught instanceof ApiError ? caught.message : 'No pudimos eliminar la materia.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="container-page py-10 pb-28 sm:py-14 sm:pb-32">
      <PageHeader
        title="Mis materias"
        description="Tu tablero académico empieza vacío. Agrega solo las materias que estás cursando y construye tu ruta de práctica."
        breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Mis materias' }]}
        actions={
          <>
            <Link to="/catalogo" className={buttonStyles('secondary', 'md')}>
              <BookOpen size={16} aria-hidden="true" />
              Explorar catálogo
            </Link>
            <Button onClick={openModal}>
              <Plus size={17} weight="bold" aria-hidden="true" />
              Agregar materia
            </Button>
          </>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="surface flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-electric/8 text-electric">
            <Books size={20} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-muted">Materias en tu tablero</p>
            <p className="text-xl font-semibold text-ink">{items.length}</p>
          </div>
        </div>
        <div className="surface flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
            <GraduationCap size={20} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-muted">Créditos registrados</p>
            <p className="text-xl font-semibold text-ink">{totalCredits}</p>
          </div>
        </div>
        <div className="surface flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-violet/10 text-violet">
            <Sparkle size={20} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-muted">Estado</p>
            <p className="text-sm font-semibold text-ink">Tablero personal</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message="No pudimos cargar tus materias." onRetry={reload} />
        ) : items.length === 0 ? (
          <div className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-line-strong bg-white px-6 py-14 text-center sm:py-20">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.10),transparent_70%)]" />
            <div className="relative mx-auto flex max-w-xl flex-col items-center">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-electric/8 text-electric">
                <Books size={30} weight="duotone" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-ink">Tu tablero está vacío</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                No hay materias precargadas. Usa el botón <strong className="font-semibold text-ink">+</strong> para
                elegir una carrera y registrar tu primera materia.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button onClick={openModal}>
                  <Plus size={17} weight="bold" aria-hidden="true" />
                  Registrar mi primera materia
                </Button>
                <Link to="/catalogo" className={buttonStyles('secondary', 'md')}>
                  Ver el catálogo completo
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="surface group flex flex-col p-5 transition hover:border-electric/30 hover:shadow-lift">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-electric/8 text-electric">
                    <Books size={19} weight="duotone" aria-hidden="true" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleting(item)}
                    className="rounded-lg p-2 text-muted transition hover:bg-rose/10 hover:text-rose focus-ring"
                    aria-label={`Eliminar ${item.name} de mi tablero`}
                  >
                    <Trash size={16} />
                  </button>
                </div>
                <Badge tone={colorTone[item.career.color] ?? 'blue'} className="mt-4 w-fit">
                  {item.career.name}
                </Badge>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-ink">{item.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-full bg-paper px-2.5 py-1 font-medium text-ink-soft">
                    Semestre {item.semester ?? '—'}
                  </span>
                  <span className="rounded-full bg-paper px-2.5 py-1 font-medium text-ink-soft">
                    {item.credits ?? 0} créditos
                  </span>
                  <span className="rounded-full bg-paper px-2.5 py-1 font-medium text-ink-soft">
                    {item.counts.exercises} ejercicios
                  </span>
                </div>
                <Link
                  to={`/catalogo/${item.subjectId}`}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-electric transition hover:gap-2"
                >
                  Abrir materia <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={openModal}
        className={cn(
          'fixed bottom-5 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-electric text-white shadow-[0_18px_40px_-12px_rgba(37,99,235,0.8)] transition hover:scale-105 hover:bg-electric-dark focus-ring sm:bottom-8 sm:right-8',
        )}
        aria-label="Agregar materia"
        title="Agregar materia"
      >
        <Plus size={26} weight="bold" aria-hidden="true" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Agregar materia"
        description="Elige la carrera y la materia que quieres seguir en tu tablero."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="subject-form" size="sm" loading={saving}>
              Agregar materia
            </Button>
          </>
        }
      >
        <form id="subject-form" onSubmit={submit} className="space-y-4">
          <Field label="Carrera" htmlFor="subject-career" required>
            <Select
              id="subject-career"
              value={careerId}
              onChange={(event) => handleCareerChange(event.target.value)}
              required
            >
              <option value="">Selecciona una carrera</option>
              {(careers.data?.items ?? []).map((career) => (
                <option key={career.id} value={career.id}>
                  {career.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Materia"
            htmlFor="subject-id"
            required
            hint={careerId ? `${filteredSubjects.length} materias disponibles en esta carrera.` : 'Primero selecciona una carrera.'}
          >
            <Select
              id="subject-id"
              value={subjectId}
              onChange={(event) => handleSubjectChange(event.target.value)}
              disabled={!careerId || subjects.loading}
              required
            >
              <option value="">{subjects.loading ? 'Cargando materias…' : 'Selecciona una materia'}</option>
              {filteredSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} · Semestre {subject.semester ?? '—'}
                </option>
              ))}
            </Select>
          </Field>
          {selectedSubject && (
            <div className="rounded-xl border border-line bg-paper/70 p-3 text-xs leading-relaxed text-muted">
              <span className="font-semibold text-ink">{selectedSubject.name}</span> · {selectedSubject.career.name}
              <br />
              {selectedSubject.counts.topics} temas · {selectedSubject.counts.exercises} ejercicios disponibles.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Semestre" htmlFor="subject-semester" hint="Opcional. Se completa con el dato del catálogo.">
              <Input
                id="subject-semester"
                type="number"
                min={1}
                max={12}
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
                placeholder="Ej. 4"
              />
            </Field>
            <Field label="Créditos" htmlFor="subject-credits" hint="Opcional.">
              <Input
                id="subject-credits"
                type="number"
                min={1}
                max={12}
                value={credits}
                onChange={(event) => setCredits(event.target.value)}
                placeholder="Ej. 4"
              />
            </Field>
          </div>
          {formError && (
            <p className="rounded-xl border border-rose/20 bg-rose/5 px-3 py-2 text-sm text-rose" role="alert">
              {formError}
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Quitar materia del tablero"
        description={deleting ? `Se quitará "${deleting.name}" de tu tablero. El catálogo y tu progreso no se eliminan.` : ''}
        confirmLabel="Quitar materia"
        loading={deleteLoading}
      />
    </div>
  );
}
