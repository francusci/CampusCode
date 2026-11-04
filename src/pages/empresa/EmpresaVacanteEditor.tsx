import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowSquareOut,
  Briefcase,
  CalendarBlank,
  CheckCircle,
  Info,
  MapPin,
  PencilSimple,
  Sparkle,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { formatDate } from '@/lib/format';
import type { CompanyVacancy, Modality, VacancyStatus, VacancyType } from '@/lib/types';

interface VacancyForm {
  title: string;
  type: VacancyType;
  description: string;
  requirements: string;
  location: string;
  modality: Modality;
  salaryRange: string;
  deadline: string;
  status: VacancyStatus;
}

function defaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const emptyForm: VacancyForm = {
  title: '',
  type: 'junior',
  description: '',
  requirements: '',
  location: 'Cartagena, Colombia',
  modality: 'hibrido',
  salaryRange: '',
  deadline: defaultDeadline(),
  status: 'draft',
};

const typeLabels: Record<VacancyType, string> = {
  empleo: 'Empleo',
  practica: 'Práctica',
  junior: 'Junior',
};

const statusLabels: Record<VacancyStatus, string> = {
  draft: 'Borrador',
  open: 'Publicada',
  closed: 'Cerrada',
};

export default function EmpresaVacanteEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);
  const vacancies = useAsyncData(() => api.get<{ items: CompanyVacancy[] }>('/company/vacancies'), [id]);
  const [form, setForm] = useState<VacancyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  const vacancy = id ? vacancies.data?.items.find((item) => item.id === id) : undefined;

  useEffect(() => {
    if (!isEdit) {
      initialized.current = true;
      return;
    }
    if (!vacancy || initialized.current) return;
    setForm({
      title: vacancy.title,
      type: vacancy.type,
      description: vacancy.description,
      requirements: vacancy.requirements,
      location: vacancy.location || '',
      modality: vacancy.modality || 'presencial',
      salaryRange: vacancy.salaryRange || '',
      deadline: vacancy.deadline,
      status: vacancy.status,
    });
    initialized.current = true;
  }, [vacancy, isEdit]);

  useEffect(() => {
    return () => {
      initialized.current = false;
    };
  }, [id]);

  function update<K extends keyof VacancyForm>(key: K, value: VacancyForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    if (form.title.trim().length < 6) return 'El título debe tener al menos 6 caracteres.';
    if (form.description.trim().length < 30) return 'La descripción debe tener al menos 30 caracteres.';
    if (form.requirements.trim().length < 10) return 'Describe los requisitos (mínimo 10 caracteres).';
    if (!form.deadline) return 'Selecciona una fecha límite.';
    return null;
  }

  async function save(nextStatus?: VacancyStatus) {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    const status = nextStatus || form.status;
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim(),
        requirements: form.requirements.trim(),
        location: form.location.trim() || null,
        modality: form.modality,
        salaryRange: form.salaryRange.trim() || null,
        deadline: form.deadline,
        status,
      };
      if (isEdit && vacancy) {
        await api.patch(`/company/vacancies/${vacancy.id}`, body);
        toast.success(status === 'open' ? 'Vacante actualizada y publicada.' : 'Vacante actualizada.');
      } else {
        await api.post('/company/vacancies', body);
        toast.success(status === 'open' ? 'Vacante publicada.' : 'Borrador de vacante guardado.');
      }
      navigate('/empresa/vacantes');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos guardar la vacante.');
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && vacancies.loading) return <PageLoader label="Cargando la vacante…" />;
  if (isEdit && vacancies.error) return <ErrorState message={vacancies.error.message} onRetry={vacancies.reload} />;
  if (isEdit && !vacancies.loading && !vacancy) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Vacante no encontrada"
        description="No existe o no pertenece a tu empresa. Vuelve a la lista para elegir una vacante válida."
        action={<Link to="/empresa/vacantes" className={buttonStyles('primary', 'sm')}>Volver a vacantes</Link>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/empresa/vacantes" className="inline-flex items-center gap-1.5 rounded text-[11.5px] font-medium text-muted transition hover:text-electric focus-ring">
        <ArrowLeft size={14} aria-hidden="true" /> Volver a vacantes
      </Link>

      <PageHeader
        title={isEdit ? 'Editar vacante' : 'Nueva vacante'}
        description={
          isEdit
            ? 'Actualiza el contenido y el estado. Los cambios se reflejan de inmediato en el portal público si la vacante está publicada.'
            : 'Describe el rol, los requisitos y las condiciones. Puedes guardarlo como borrador y publicarlo cuando esté listo.'
        }
        actions={
          isEdit && vacancy?.status === 'open' ? (
            <Link to="/empresas#vacantes" className={buttonStyles('secondary', 'md')}>
              <ArrowSquareOut size={14} aria-hidden="true" /> Ver portal
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-5">
          <section className="surface p-5 sm:p-6" aria-labelledby="vacancy-info-title">
            <div className="flex items-center gap-2">
              <PencilSimple size={17} className="text-electric" aria-hidden="true" />
              <h2 id="vacancy-info-title" className="text-sm font-semibold text-ink">Información de la vacante</h2>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label="Título del cargo" htmlFor="title" required hint="Entre 6 y 140 caracteres. Evita abreviaturas internas.">
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => update('title', event.target.value)}
                  maxLength={140}
                  placeholder="Ej. Analista de datos junior"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo de oportunidad" htmlFor="type" required>
                  <Select id="type" value={form.type} onChange={(event) => update('type', event.target.value as VacancyType)}>
                    <option value="junior">Junior</option>
                    <option value="practica">Práctica</option>
                    <option value="empleo">Empleo</option>
                  </Select>
                </Field>
                <Field label="Fecha límite" htmlFor="deadline" required hint="La vacante dejará de aparecer en el portal al cerrarse.">
                  <Input id="deadline" type="date" value={form.deadline} onChange={(event) => update('deadline', event.target.value)} />
                </Field>
              </div>
              <Field label="Descripción" htmlFor="description" required hint="Explica el rol, el equipo y el impacto del trabajo (mínimo 30 caracteres).">
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                  maxLength={4000}
                  className="min-h-32"
                  placeholder="Buscamos una persona junior para apoyar..."
                />
              </Field>
              <Field label="Requisitos" htmlFor="requirements" required hint="Formación, experiencia deseada y habilidades concretas (mínimo 10 caracteres).">
                <Textarea
                  id="requirements"
                  value={form.requirements}
                  onChange={(event) => update('requirements', event.target.value)}
                  maxLength={2500}
                  className="min-h-28"
                  placeholder="Estudiantes de últimos semestres con..."
                />
              </Field>
            </div>
          </section>

          <section className="surface p-5 sm:p-6" aria-labelledby="vacancy-conditions-title">
            <div className="flex items-center gap-2">
              <MapPin size={17} className="text-emerald" aria-hidden="true" />
              <h2 id="vacancy-conditions-title" className="text-sm font-semibold text-ink">Ubicación y condiciones</h2>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Ubicación" htmlFor="location" hint="Ciudad o país. Opcional para roles remotos.">
                <Input id="location" value={form.location} onChange={(event) => update('location', event.target.value)} maxLength={120} placeholder="Cartagena, Colombia" />
              </Field>
              <Field label="Modalidad" htmlFor="modality" required>
                <Select id="modality" value={form.modality} onChange={(event) => update('modality', event.target.value as Modality)}>
                  <option value="presencial">Presencial</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="remoto">Remoto</option>
                </Select>
              </Field>
              <Field label="Rango salarial" htmlFor="salary" hint="Opcional. Usa un rango claro o escribe 'Auxilio de práctica'.">
                <Input id="salary" value={form.salaryRange} onChange={(event) => update('salaryRange', event.target.value)} maxLength={100} placeholder="Ej. $2.800.000 - $3.600.000" />
              </Field>
              <Field label="Estado" htmlFor="status" hint="Los borradores no aparecen en el portal público.">
                <Select id="status" value={form.status} onChange={(event) => update('status', event.target.value as VacancyStatus)}>
                  <option value="draft">Borrador</option>
                  <option value="open">Publicada</option>
                  <option value="closed">Cerrada</option>
                </Select>
              </Field>
            </div>
          </section>

          <div className="sticky bottom-3 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-line bg-white/95 p-3 shadow-lift backdrop-blur">
            <Link to="/empresa/vacantes" className={buttonStyles('ghost', 'md')}>Cancelar</Link>
            {form.status !== 'draft' && (
              <Button variant="secondary" onClick={() => save('draft')} loading={saving}>Guardar borrador</Button>
            )}
            <Button onClick={() => save()} loading={saving} icon={<CheckCircle size={15} aria-hidden="true" />}>
              {isEdit ? 'Guardar cambios' : form.status === 'draft' ? 'Guardar borrador' : 'Publicar vacante'}
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="surface p-5" aria-labelledby="vacancy-preview-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="vacancy-preview-title" className="text-sm font-semibold text-ink">Vista previa</h2>
              <Badge tone={form.status === 'open' ? 'emerald' : form.status === 'draft' ? 'amber' : 'slate'}>
                {statusLabels[form.status]}
              </Badge>
            </div>
            <div className="mt-3 rounded-xl border border-line bg-paper/40 p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="blue">{typeLabels[form.type]}</Badge>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted">
                  <CalendarBlank size={11} aria-hidden="true" /> {form.deadline ? formatDate(form.deadline) : 'Sin fecha'}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold leading-snug text-ink">{form.title.trim() || 'Título de la vacante'}</h3>
              <p className="mt-1.5 line-clamp-3 text-[11.5px] leading-relaxed text-muted">
                {form.description.trim() || 'Aquí aparecerá la descripción que verán los estudiantes en el portal.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted">
                {form.location.trim() && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1"><MapPin size={10} aria-hidden="true" />{form.location.trim()}</span>}
                <span className="rounded-full bg-white px-2 py-1 capitalize">{form.modality}</span>
                {form.salaryRange.trim() && <span className="rounded-full bg-white px-2 py-1">{form.salaryRange.trim()}</span>}
              </div>
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-muted">La vista previa es orientativa. El portal público aplica su propio formato.</p>
          </section>

          <section className="surface p-5" aria-labelledby="vacancy-tips-title">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-electric" aria-hidden="true" />
              <h2 id="vacancy-tips-title" className="text-sm font-semibold text-ink">Antes de publicar</h2>
            </div>
            <ul className="mt-3 space-y-2 text-[11.5px] leading-relaxed text-muted">
              <li>· Define funciones y requisitos verificables.</li>
              <li>· Indica modalidad, ubicación y rango salarial.</li>
              <li>· Evita pedir datos personales innecesarios.</li>
              <li>· Agrega una prueba técnica si aplica.</li>
            </ul>
            <Link to="/empresa/pruebas/nuevo" className="mt-4 inline-flex items-center gap-1.5 rounded text-[11px] font-semibold text-electric hover:underline focus-ring">
              <Sparkle size={13} aria-hidden="true" /> Crear prueba técnica
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
