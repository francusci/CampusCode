import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowSquareOut,
  CalendarBlank,
  CheckCircle,
  Info,
  PaperPlaneTilt,
  PencilSimple,
  Sparkle,
  Trophy,
  UsersThree,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/format';
import type { CompanyChallenge } from '@/lib/types';

interface ChallengeForm {
  title: string;
  summary: string;
  category: string;
  deadline: string;
  status: CompanyChallenge['status'];
  description: string;
  problem: string;
  skills: string;
  requirements: string;
  deliverables: string;
}

function defaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

const emptyForm: ChallengeForm = {
  title: '',
  summary: '',
  category: '',
  deadline: defaultDeadline(),
  status: 'draft',
  description: '',
  problem: '',
  skills: '',
  requirements: '',
  deliverables: '',
};

export default function EmpresaRetoEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);
  const challenges = useAsyncData(
    () => api.get<{ items: CompanyChallenge[] }>('/company/challenges'),
    [id],
  );
  const [form, setForm] = useState<ChallengeForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  const challenge = id ? challenges.data?.items.find((item) => item.id === id) : undefined;

  useEffect(() => {
    if (!isEdit) {
      initialized.current = true;
      return;
    }
    if (!challenge || initialized.current) return;
    setForm({
      title: challenge.title,
      summary: challenge.summary,
      category: challenge.category,
      deadline: challenge.deadline,
      status: challenge.status,
      description: challenge.description,
      problem: challenge.problem,
      skills: challenge.skills.join(', '),
      requirements: challenge.requirements,
      deliverables: challenge.deliverables,
    });
    initialized.current = true;
  }, [challenge, isEdit]);

  useEffect(() => {
    return () => {
      initialized.current = false;
    };
  }, [id]);

  function update<K extends keyof ChallengeForm>(key: K, value: ChallengeForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    if (form.title.trim().length < 8) return 'El título debe tener al menos 8 caracteres.';
    if (form.summary.trim().length < 20) return 'El resumen debe tener al menos 20 caracteres.';
    if (form.description.trim().length < 30) return 'La descripción debe tener al menos 30 caracteres.';
    if (form.problem.trim().length < 20) return 'El problema debe tener al menos 20 caracteres.';
    if (form.category.trim().length < 3) return 'Indica una categoría de al menos 3 caracteres.';
    if (!form.deadline) return 'Selecciona una fecha límite.';
    if (form.requirements.trim().length < 10) return 'Describe los requisitos (mínimo 10 caracteres).';
    if (form.deliverables.trim().length < 10) return 'Describe los entregables (mínimo 10 caracteres).';
    const skills = form.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
    if (skills.length === 0) return 'Agrega al menos una habilidad requerida.';
    if (skills.length > 10) return 'Puedes indicar hasta 10 habilidades.';
    if (skills.some((skill) => skill.length > 40)) return 'Cada habilidad debe tener máximo 40 caracteres.';
    return null;
  }

  async function save(nextStatus?: CompanyChallenge['status']) {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    const skills = form.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
    const status = nextStatus || form.status;
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        category: form.category.trim(),
        deadline: form.deadline,
        status,
        description: form.description.trim(),
        problem: form.problem.trim(),
        skills,
        requirements: form.requirements.trim(),
        deliverables: form.deliverables.trim(),
      };
      if (isEdit && challenge) {
        await api.patch(`/company/challenges/${challenge.id}`, body);
        toast.success(status === 'open' ? 'Reto actualizado y publicado.' : 'Reto actualizado.');
      } else {
        await api.post('/company/challenges', body);
        toast.success(status === 'open' ? 'Reto publicado.' : 'Borrador guardado.');
      }
      navigate('/empresa/retos');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos guardar el reto.');
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && challenges.loading) return <PageLoader label="Cargando el reto…" />;
  if (isEdit && challenges.error) return <ErrorState message={challenges.error.message} onRetry={challenges.reload} />;
  if (isEdit && !challenges.loading && !challenge) {
    return (
      <EmptyState
        icon={Trophy}
        title="Reto no encontrado"
        description="No existe o no pertenece a tu empresa. Vuelve a la lista para elegir un reto válido."
        action={<Link to="/empresa/retos" className={buttonStyles('primary', 'sm')}>Volver a mis retos</Link>}
      />
    );
  }

  const skillsPreview = form.skills.split(',').map((skill) => skill.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <Link to="/empresa/retos" className="inline-flex items-center gap-1.5 rounded text-[11.5px] font-medium text-muted transition hover:text-electric focus-ring">
        <ArrowLeft size={14} aria-hidden="true" /> Volver a mis retos
      </Link>

      <PageHeader
        title={isEdit ? 'Editar reto' : 'Nuevo reto'}
        description={
          isEdit
            ? 'Actualiza el contenido y el estado del reto. Los cambios se reflejan de inmediato en el catálogo público si está abierto.'
            : 'Describe un problema real con suficiente contexto para que un estudiante pueda abordarlo. Puedes guardarlo como borrador antes de publicarlo.'
        }
        actions={
          isEdit && challenge && challenge.status !== 'draft' ? (
            <Link to={`/retos/${challenge.slug}`} className={buttonStyles('secondary', 'md')}>
              <ArrowSquareOut size={14} aria-hidden="true" /> Ver público
            </Link>
          ) : undefined
        }
      />

      {isEdit && challenge && challenge.applicationsCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber/20 bg-amber/[0.055] px-4 py-3 text-xs leading-relaxed text-amber" role="note">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Este reto tiene {challenge.applicationsCount} postulaciones. Puedes editar el contenido y cerrarlo, pero no eliminarlo mientras conserve postulaciones.
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="surface p-5 sm:p-6" aria-labelledby="info-basica-title">
            <div className="flex items-center gap-2">
              <PencilSimple size={17} className="text-electric" aria-hidden="true" />
              <h2 id="info-basica-title" className="text-sm font-semibold text-ink">Información básica</h2>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label="Título del reto" htmlFor="title" required hint="Entre 8 y 140 caracteres. Debe describir el desafío, no solo el área.">
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => update('title', event.target.value)}
                  maxLength={140}
                  placeholder="Ej. Diseña un tablero de control para inventario"
                />
              </Field>
              <Field label="Resumen" htmlFor="summary" required hint="Una o dos frases que aparecerán en la tarjeta pública del reto (mínimo 20 caracteres).">
                <Textarea
                  id="summary"
                  value={form.summary}
                  onChange={(event) => update('summary', event.target.value)}
                  maxLength={400}
                  className="min-h-20"
                  placeholder="Explica el objetivo del reto y el resultado esperado."
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Categoría" htmlFor="category" required hint="Ej. Análisis de datos, Desarrollo web, Producto.">
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(event) => update('category', event.target.value)}
                    maxLength={60}
                    placeholder="Análisis de datos"
                  />
                </Field>
                <Field label="Fecha límite" htmlFor="deadline" required hint="Los estudiantes podrán postularse hasta esta fecha.">
                  <Input
                    id="deadline"
                    type="date"
                    value={form.deadline}
                    onChange={(event) => update('deadline', event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Habilidades requeridas" htmlFor="skills" required hint="Sepáralas con comas. Máximo 10, por ejemplo: SQL, Excel, Visualización de datos.">
                <Input
                  id="skills"
                  value={form.skills}
                  onChange={(event) => update('skills', event.target.value)}
                  placeholder="SQL, Python, Comunicación"
                />
              </Field>
            </div>
          </section>

          <section className="surface p-5 sm:p-6" aria-labelledby="contexto-title">
            <div className="flex items-center gap-2">
              <Sparkle size={17} className="text-violet" aria-hidden="true" />
              <h2 id="contexto-title" className="text-sm font-semibold text-ink">Contexto y problema</h2>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label="Descripción del contexto" htmlFor="description" required hint="Explica la empresa o situación ficticia o real, el área y por qué el problema importa (mínimo 30 caracteres).">
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                  maxLength={4000}
                  className="min-h-32"
                  placeholder="Una empresa del sector retail necesita entender..."
                />
              </Field>
              <Field label="Problema a resolver" htmlFor="problem" required hint="Formula el reto de forma concreta. Evita pedidos genéricos (mínimo 20 caracteres).">
                <Textarea
                  id="problem"
                  value={form.problem}
                  onChange={(event) => update('problem', event.target.value)}
                  maxLength={2500}
                  className="min-h-28"
                  placeholder="Actualmente el inventario se revisa en hojas separadas y no hay una vista consolidada..."
                />
              </Field>
            </div>
          </section>

          <section className="surface p-5 sm:p-6" aria-labelledby="entrega-title">
            <div className="flex items-center gap-2">
              <CheckCircle size={17} className="text-emerald" aria-hidden="true" />
              <h2 id="entrega-title" className="text-sm font-semibold text-ink">Requisitos y entregables</h2>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label="Requisitos de participación" htmlFor="requirements" required hint="Qué debe cumplir la persona o el equipo para participar (mínimo 10 caracteres).">
                <Textarea
                  id="requirements"
                  value={form.requirements}
                  onChange={(event) => update('requirements', event.target.value)}
                  maxLength={2000}
                  className="min-h-24"
                  placeholder="Estudiantes de últimos semestres con conocimientos básicos de..."
                />
              </Field>
              <Field label="Entregables" htmlFor="deliverables" required hint="Describe qué debe entregarse y en qué formato (mínimo 10 caracteres).">
                <Textarea
                  id="deliverables"
                  value={form.deliverables}
                  onChange={(event) => update('deliverables', event.target.value)}
                  maxLength={2000}
                  className="min-h-24"
                  placeholder="Un documento de 2 páginas con el diagnóstico y un prototipo navegable..."
                />
              </Field>
            </div>
          </section>

          <section className="surface p-5 sm:p-6" aria-labelledby="publicacion-title">
            <div className="flex items-center gap-2">
              <PaperPlaneTilt size={17} className="text-electric" aria-hidden="true" />
              <h2 id="publicacion-title" className="text-sm font-semibold text-ink">Publicación</h2>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:items-start">
              <Field label="Estado del reto" htmlFor="status" hint="Los borradores no aparecen en el catálogo público. Los retos cerrados quedan visibles como histórico.">
                <Select id="status" value={form.status} onChange={(event) => update('status', event.target.value as ChallengeForm['status'])}>
                  <option value="draft">Borrador</option>
                  <option value="open">Abierto</option>
                  <option value="closed">Cerrado</option>
                </Select>
              </Field>
              <div className="rounded-xl border border-line bg-paper/60 p-3 text-[11px] leading-relaxed text-muted">
                <p className="font-semibold text-ink">Antes de publicar</p>
                <ul className="mt-1.5 space-y-1">
                  <li>· Verifica que la fecha límite sea futura.</li>
                  <li>· Revisa que los entregables sean verificables.</li>
                  <li>· Evita incluir datos personales o confidenciales reales.</li>
                </ul>
              </div>
            </div>
          </section>

          <div className="sticky bottom-3 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-line bg-white/95 p-3 shadow-lift backdrop-blur">
            <Link to="/empresa/retos" className={buttonStyles('ghost', 'md')}>Cancelar</Link>
            {!isEdit && form.status !== 'draft' && (
              <Button variant="secondary" onClick={() => save('draft')} loading={saving}>
                Guardar borrador
              </Button>
            )}
            <Button onClick={() => save()} loading={saving} icon={<CheckCircle size={15} aria-hidden="true" />}>
              {isEdit ? 'Guardar cambios' : form.status === 'draft' ? 'Guardar borrador' : 'Publicar reto'}
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="surface p-5" aria-labelledby="preview-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="preview-title" className="text-sm font-semibold text-ink">Vista previa</h2>
              <Badge tone={form.status === 'open' ? 'emerald' : form.status === 'draft' ? 'amber' : 'slate'}>
                {form.status === 'open' ? 'Abierto' : form.status === 'draft' ? 'Borrador' : 'Cerrado'}
              </Badge>
            </div>
            <div className="mt-3 rounded-xl border border-line bg-paper/40 p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="blue">{form.category.trim() || 'Categoría'}</Badge>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted">
                  <CalendarBlank size={11} aria-hidden="true" /> {form.deadline ? formatDate(form.deadline) : 'Sin fecha'}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold leading-snug text-ink">
                {form.title.trim() || 'Título del reto'}
              </h3>
              <p className="mt-1.5 whitespace-pre-line text-[11.5px] leading-relaxed text-muted">
                {form.summary.trim() || 'Aquí aparecerá el resumen que verán los estudiantes en el catálogo.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {skillsPreview.length === 0 ? (
                  <span className="text-[10.5px] text-muted">Habilidades por definir</span>
                ) : (
                  skillsPreview.map((skill) => (
                    <span key={skill} className="rounded-md bg-white px-2 py-0.5 text-[10.5px] font-medium text-ink-soft">{skill}</span>
                  ))
                )}
              </div>
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
              La vista previa es orientativa. El catálogo público aplica su propio formato de tarjeta.
            </p>
          </section>

          <section className="surface p-5" aria-labelledby="guia-title">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-electric" aria-hidden="true" />
              <h2 id="guia-title" className="text-sm font-semibold text-ink">Guía rápida</h2>
            </div>
            <ol className="mt-3 space-y-2.5 text-[11.5px] leading-relaxed text-muted">
              <li><span className="font-semibold text-ink">1. Contexto.</span> Sitúa el problema en un escenario comprensible.</li>
              <li><span className="font-semibold text-ink">2. Alcance.</span> Delimita qué debe resolverse y qué queda fuera.</li>
              <li><span className="font-semibold text-ink">3. Evidencia.</span> Define entregables que puedan revisarse.</li>
              <li><span className="font-semibold text-ink">4. Revisión.</span> Responde a las postulaciones y actualiza su estado.</li>
            </ol>
            <Link to="/empresa/postulaciones" className="mt-4 inline-flex items-center gap-1.5 rounded text-[11px] font-semibold text-electric hover:underline focus-ring">
              <UsersThree size={13} aria-hidden="true" /> Ir a postulaciones
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
