import { useMemo, useState } from 'react';
import {
  BookOpen,
  Books,
  CheckCircle,
  GraduationCap,
  MagnifyingGlass,
  Plus,
  SealCheck,
  X,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { CareerIcon } from '@/components/ui/CareerIcon';
import { cn } from '@/lib/cn';
import type { AdminCareer, AdminSubject } from '@/lib/types';

interface CareerForm {
  name: string;
  faculty: string;
  description: string;
  icon: string;
  color: string;
}

interface SubjectForm {
  careerId: string;
  name: string;
  description: string;
  semester: string;
  credits: string;
}

const emptyCareer: CareerForm = {
  name: '',
  faculty: '',
  description: '',
  icon: 'Compass',
  color: 'blue',
};

const emptySubject: SubjectForm = {
  careerId: '',
  name: '',
  description: '',
  semester: '',
  credits: '',
};

const iconOptions = [
  { value: 'Compass', label: 'Brújula' },
  { value: 'Code', label: 'Código' },
  { value: 'GearSix', label: 'Engranaje' },
  { value: 'Briefcase', label: 'Maletín' },
  { value: 'Scales', label: 'Balanza' },
  { value: 'Heartbeat', label: 'Salud' },
  { value: 'ChartLineUp', label: 'Gráfica' },
];

const colorOptions = ['blue', 'cyan', 'amber', 'rose', 'emerald', 'violet', 'slate'];

export default function AdminMaterias() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<{ careers: AdminCareer[]; subjects: AdminSubject[] }>('/admin/catalog'),
    [],
  );
  const [q, setQ] = useState('');
  const [careerOpen, setCareerOpen] = useState(false);
  const [careerForm, setCareerForm] = useState<CareerForm>(emptyCareer);
  const [careerSaving, setCareerSaving] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState<SubjectForm>(emptySubject);
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [publishBusy, setPublishBusy] = useState<string | null>(null);

  const careers = data?.careers || [];
  const subjects = data?.subjects || [];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return { careers, subjects };
    const matchingSubjects = subjects.filter((subject) =>
      [subject.name, subject.description, subject.career_name].join(' ').toLowerCase().includes(term),
    );
    const careerIds = new Set(matchingSubjects.map((subject) => subject.career_id));
    return {
      careers: careers.filter((career) =>
        [career.name, career.faculty, career.description].join(' ').toLowerCase().includes(term) || careerIds.has(career.id),
      ),
      subjects: matchingSubjects,
    };
  }, [careers, q, subjects]);

  const summary = useMemo(
    () => ({
      careers: careers.length,
      subjects: subjects.length,
      published: subjects.filter((subject) => Boolean(subject.is_published)).length,
      demo: subjects.filter((subject) => Boolean(subject.is_demo)).length,
    }),
    [careers.length, subjects],
  );

  function updateCareer<K extends keyof CareerForm>(key: K, value: CareerForm[K]) {
    setCareerForm((current) => ({ ...current, [key]: value }));
  }

  function updateSubject<K extends keyof SubjectForm>(key: K, value: SubjectForm[K]) {
    setSubjectForm((current) => ({ ...current, [key]: value }));
  }

  function openCareerModal() {
    setCareerForm(emptyCareer);
    setCareerOpen(true);
  }

  function openSubjectModal(careerId = '') {
    setSubjectForm({ ...emptySubject, careerId });
    setSubjectOpen(true);
  }

  async function createCareer() {
    if (careerForm.name.trim().length < 4) return toast.error('El nombre de la carrera debe tener al menos 4 caracteres.');
    if (careerForm.faculty.trim().length < 4) return toast.error('La facultad debe tener al menos 4 caracteres.');
    if (careerForm.description.trim().length < 10) return toast.error('La descripción debe tener al menos 10 caracteres.');
    setCareerSaving(true);
    try {
      await api.post('/admin/careers', {
        name: careerForm.name.trim(),
        faculty: careerForm.faculty.trim(),
        description: careerForm.description.trim(),
        icon: careerForm.icon,
        color: careerForm.color,
      });
      toast.success('Carrera creada.');
      setCareerOpen(false);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos crear la carrera.');
    } finally {
      setCareerSaving(false);
    }
  }

  async function createSubject() {
    if (!subjectForm.careerId) return toast.error('Selecciona una carrera.');
    if (subjectForm.name.trim().length < 4) return toast.error('El nombre de la materia debe tener al menos 4 caracteres.');
    if (subjectForm.description.trim().length < 10) return toast.error('La descripción debe tener al menos 10 caracteres.');
    setSubjectSaving(true);
    try {
      await api.post('/admin/subjects', {
        careerId: subjectForm.careerId,
        name: subjectForm.name.trim(),
        description: subjectForm.description.trim(),
        semester: subjectForm.semester ? Number(subjectForm.semester) : null,
        credits: subjectForm.credits ? Number(subjectForm.credits) : null,
      });
      toast.success('Materia creada y publicada.');
      setSubjectOpen(false);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos crear la materia.');
    } finally {
      setSubjectSaving(false);
    }
  }

  async function toggleSubject(subject: AdminSubject) {
    setPublishBusy(subject.id);
    try {
      await api.patch(`/admin/subjects/${subject.id}`, { isPublished: !subject.is_published });
      toast.success(subject.is_published ? 'Materia despublicada.' : 'Materia publicada.');
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar la materia.');
    } finally {
      setPublishBusy(null);
    }
  }

  if (loading) return <PageLoader label="Cargando catálogo académico…" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carreras y materias"
        description="Administra la estructura académica que alimenta el banco de ejercicios. Las materias despublicadas dejan de mostrarse en el catálogo público."
        actions={
          <>
            <Button variant="secondary" onClick={() => openSubjectModal()} icon={<BookOpen size={15} aria-hidden="true" />}>Nueva materia</Button>
            <Button onClick={openCareerModal} icon={<Plus size={15} aria-hidden="true" />}>Nueva carrera</Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen del catálogo">
        <StatCard label="Carreras" value={summary.careers} hint="Programas académicos" icon={<GraduationCap size={18} />} />
        <StatCard label="Materias" value={summary.subjects} hint="En todas las carreras" icon={<Books size={18} />} tone="violet" />
        <StatCard label="Publicadas" value={summary.published} hint="Visibles para estudiantes" icon={<CheckCircle size={18} />} tone="emerald" />
        <StatCard label="De demostración" value={summary.demo} hint="Contenido inicial etiquetado" icon={<SealCheck size={18} />} tone="amber" />
      </section>

      <section className="surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar carrera, facultad o materia…"
              aria-label="Buscar en el catálogo académico"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
          {q && <Button variant="ghost" size="sm" onClick={() => setQ('')} icon={<X size={13} />}>Limpiar</Button>}
        </div>
        <p className="mt-3 text-[11px] text-muted">
          {filtered.careers.length} carreras y {filtered.subjects.length} materias coinciden con la búsqueda.
        </p>
      </section>

      <section aria-labelledby="carreras-title">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="carreras-title" className="text-lg font-semibold text-ink">Carreras</h2>
            <p className="mt-0.5 text-[11px] text-muted">Cada carrera agrupa materias y organiza el catálogo público.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={openCareerModal} icon={<Plus size={13} aria-hidden="true" />}>Agregar</Button>
        </div>
        {filtered.careers.length === 0 ? (
          <div className="mt-4"><EmptyState icon={GraduationCap} title="Sin carreras" description="Crea una carrera para empezar a organizar materias y ejercicios." action={<Button size="sm" onClick={openCareerModal}>Crear carrera</Button>} /></div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.careers.map((career) => (
              <article key={career.id} className="surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <CareerIcon name={career.icon} color={career.color} />
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {career.isDemo && <Badge tone="amber">Demo</Badge>}
                    <Badge tone="slate">{career.subjectCount} materias</Badge>
                  </div>
                </div>
                <h3 className="mt-3 text-[14px] font-semibold leading-snug text-ink">{career.name}</h3>
                <p className="mt-0.5 text-[10.5px] text-muted">{career.faculty}</p>
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted">{career.description}</p>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-[10.5px] text-muted">{career.exerciseCount} ejercicios</span>
                  <button type="button" onClick={() => openSubjectModal(career.id)} className="inline-flex items-center gap-1 rounded text-[10.5px] font-semibold text-electric hover:underline focus-ring">
                    <Plus size={11} aria-hidden="true" /> Materia
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="materias-title">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="materias-title" className="text-lg font-semibold text-ink">Materias</h2>
            <p className="mt-0.5 text-[11px] text-muted">Controla qué materias se muestran en el catálogo público.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => openSubjectModal()} icon={<Plus size={13} aria-hidden="true" />}>Agregar</Button>
        </div>

        {filtered.subjects.length === 0 ? (
          <div className="mt-4"><EmptyState icon={Books} title="Sin materias" description="Crea una materia dentro de una carrera para asociarle temas y ejercicios." action={<Button size="sm" onClick={() => openSubjectModal()}>Crear materia</Button>} /></div>
        ) : (
          <div className="mt-4 surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-paper/50 text-[9.5px] uppercase tracking-[0.12em] text-muted">
                    <th className="px-4 py-3 font-semibold">Materia</th>
                    <th className="px-4 py-3 font-semibold">Carrera</th>
                    <th className="px-4 py-3 font-semibold">Semestre</th>
                    <th className="px-4 py-3 font-semibold">Ejercicios</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.subjects.map((subject) => (
                    <tr key={subject.id} className="border-b border-line/70 last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-[12.5px] font-semibold text-ink">
                          {subject.name}
                          {Boolean(subject.is_demo) && <span className="ml-1.5 rounded bg-amber/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber">Demo</span>}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted">{subject.description}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted">{subject.career_name}</td>
                      <td className="px-4 py-3 text-[11px] text-muted">{subject.semester ?? '—'}</td>
                      <td className="px-4 py-3 text-[11px] text-muted">{subject.exercise_count}</td>
                      <td className="px-4 py-3">
                        <Badge tone={subject.is_published ? 'emerald' : 'slate'}>{subject.is_published ? 'Publicada' : 'Oculta'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={publishBusy === subject.id}
                          onClick={() => toggleSubject(subject)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10.5px] font-semibold transition focus-ring disabled:opacity-40',
                            subject.is_published
                              ? 'border-line-strong text-ink-soft hover:bg-paper'
                              : 'border-emerald/25 text-emerald hover:bg-emerald/5',
                          )}
                        >
                          {subject.is_published ? 'Despublicar' : 'Publicar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <Modal
        open={careerOpen}
        onClose={() => setCareerOpen(false)}
        title="Nueva carrera"
        description="Crea un programa académico. Podrás agregarle materias y temas después."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCareerOpen(false)} disabled={careerSaving}>Cancelar</Button>
            <Button size="sm" onClick={createCareer} loading={careerSaving}>Crear carrera</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Nombre" htmlFor="career-name" required hint="Mínimo 4 caracteres.">
            <Input id="career-name" value={careerForm.name} onChange={(event) => updateCareer('name', event.target.value)} maxLength={100} placeholder="Ingeniería de Software" />
          </Field>
          <Field label="Facultad" htmlFor="career-faculty" required>
            <Input id="career-faculty" value={careerForm.faculty} onChange={(event) => updateCareer('faculty', event.target.value)} maxLength={120} placeholder="Facultad de Ingeniería" />
          </Field>
          <Field label="Descripción" htmlFor="career-description" required hint="Mínimo 10 caracteres.">
            <Textarea id="career-description" value={careerForm.description} onChange={(event) => updateCareer('description', event.target.value)} maxLength={500} className="min-h-24" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Icono" htmlFor="career-icon">
              <Select id="career-icon" value={careerForm.icon} onChange={(event) => updateCareer('icon', event.target.value)}>
                {iconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </Field>
            <Field label="Color" htmlFor="career-color">
              <Select id="career-color" value={careerForm.color} onChange={(event) => updateCareer('color', event.target.value)}>
                {colorOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </Select>
            </Field>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-paper/50 p-3">
            <CareerIcon name={careerForm.icon} color={careerForm.color} size="sm" />
            <span className="text-[11.5px] text-muted">Vista previa del icono en el catálogo.</span>
          </div>
        </div>
      </Modal>

      <Modal
        open={subjectOpen}
        onClose={() => setSubjectOpen(false)}
        title="Nueva materia"
        description="La materia se crea publicada. Podrás ocultarla desde la tabla de materias."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setSubjectOpen(false)} disabled={subjectSaving}>Cancelar</Button>
            <Button size="sm" onClick={createSubject} loading={subjectSaving}>Crear materia</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Carrera" htmlFor="subject-career" required>
            <Select id="subject-career" value={subjectForm.careerId} onChange={(event) => updateSubject('careerId', event.target.value)}>
              <option value="">Selecciona una carrera</option>
              {careers.map((career) => <option key={career.id} value={career.id}>{career.name}</option>)}
            </Select>
          </Field>
          <Field label="Nombre de la materia" htmlFor="subject-name" required>
            <Input id="subject-name" value={subjectForm.name} onChange={(event) => updateSubject('name', event.target.value)} maxLength={100} placeholder="Estructuras de datos" />
          </Field>
          <Field label="Descripción" htmlFor="subject-description" required hint="Mínimo 10 caracteres.">
            <Textarea id="subject-description" value={subjectForm.description} onChange={(event) => updateSubject('description', event.target.value)} maxLength={500} className="min-h-24" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Semestre" htmlFor="subject-semester" hint="Opcional, entre 1 y 12.">
              <Input id="subject-semester" type="number" min={1} max={12} value={subjectForm.semester} onChange={(event) => updateSubject('semester', event.target.value)} />
            </Field>
            <Field label="Créditos" htmlFor="subject-credits" hint="Opcional, entre 1 y 12.">
              <Input id="subject-credits" type="number" min={1} max={12} value={subjectForm.credits} onChange={(event) => updateSubject('credits', event.target.value)} />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
