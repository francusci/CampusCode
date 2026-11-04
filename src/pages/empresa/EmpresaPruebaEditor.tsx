import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowSquareOut,
  CheckCircle,
  ClipboardText,
  Clock,
  Info,
  PencilSimple,
  Plus,
  Trash,
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
import { plural } from '@/lib/format';
import type { CompanyTechnicalTest, CompanyVacancy, TechnicalTestQuestion } from '@/lib/types';

type QuestionType = 'multiple' | 'open';

interface QuestionForm {
  prompt: string;
  type: QuestionType;
  options: string;
  answer: string;
}

interface TestForm {
  title: string;
  description: string;
  instructions: string;
  durationMinutes: string;
  passingScore: string;
  status: 'draft' | 'published' | 'archived';
  vacancyId: string;
  questions: QuestionForm[];
}

const emptyQuestion = (): QuestionForm => ({ prompt: '', type: 'multiple', options: '', answer: '' });

const emptyForm: TestForm = {
  title: '',
  description: '',
  instructions: '',
  durationMinutes: '30',
  passingScore: '70',
  status: 'draft',
  vacancyId: '',
  questions: [emptyQuestion()],
};

function parseOptions(value: string) {
  const lines = value.split('\n').map((item) => item.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function questionToForm(question: TechnicalTestQuestion): QuestionForm {
  return {
    prompt: question.prompt,
    type: question.type,
    options: question.options.join('\n'),
    answer: question.answer || '',
  };
}

export default function EmpresaPruebaEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);
  const tests = useAsyncData(() => api.get<{ items: CompanyTechnicalTest[] }>('/company/technical-tests'), [id]);
  const vacancies = useAsyncData(() => api.get<{ items: CompanyVacancy[] }>('/company/vacancies'), []);
  const [form, setForm] = useState<TestForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  const test = id ? tests.data?.items.find((item) => item.id === id) : undefined;
  const vacancyOptions = (vacancies.data?.items || []).filter((vacancy) => vacancy.status !== 'closed');

  useEffect(() => {
    if (!isEdit) {
      initialized.current = true;
      return;
    }
    if (!test || initialized.current) return;
    setForm({
      title: test.title,
      description: test.description,
      instructions: test.instructions || '',
      durationMinutes: String(test.durationMinutes),
      passingScore: String(test.passingScore),
      status: test.status,
      vacancyId: test.vacancyId || '',
      questions: test.questions.length > 0 ? test.questions.map(questionToForm) : [emptyQuestion()],
    });
    initialized.current = true;
  }, [test, isEdit]);

  useEffect(() => {
    return () => {
      initialized.current = false;
    };
  }, [id]);

  function update<K extends keyof TestForm>(key: K, value: TestForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateQuestion(index: number, patch: Partial<QuestionForm>) {
    setForm((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    }));
  }

  function addQuestion() {
    setForm((current) => ({ ...current, questions: [...current.questions, emptyQuestion()] }));
  }

  function removeQuestion(index: number) {
    setForm((current) => ({
      ...current,
      questions: current.questions.length === 1
        ? current.questions
        : current.questions.filter((_, questionIndex) => questionIndex !== index),
    }));
  }

  function validate() {
    const duration = Number(form.durationMinutes);
    const passing = Number(form.passingScore);
    if (form.title.trim().length < 6) return 'El título debe tener al menos 6 caracteres.';
    if (form.description.trim().length < 20) return 'La descripción debe tener al menos 20 caracteres.';
    if (!Number.isInteger(duration) || duration < 5 || duration > 240) return 'La duración debe estar entre 5 y 240 minutos.';
    if (!Number.isInteger(passing) || passing < 0 || passing > 100) return 'El puntaje mínimo debe estar entre 0 y 100.';
    if (form.status === 'published' && form.questions.length === 0) return 'Agrega al menos una pregunta antes de publicar.';
    for (const [index, question] of form.questions.entries()) {
      if (question.prompt.trim().length < 5) return `La pregunta ${index + 1} debe tener al menos 5 caracteres.`;
      if (question.type === 'multiple' && parseOptions(question.options).length < 2) {
        return `La pregunta ${index + 1} necesita al menos dos opciones.`;
      }
    }
    return null;
  }

  async function save(nextStatus?: TestForm['status']) {
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
        description: form.description.trim(),
        instructions: form.instructions.trim() || null,
        durationMinutes: Number(form.durationMinutes),
        passingScore: Number(form.passingScore),
        status,
        vacancyId: form.vacancyId || null,
        questions: form.questions.map((question) => ({
          prompt: question.prompt.trim(),
          type: question.type,
          options: question.type === 'multiple' ? parseOptions(question.options) : [],
          answer: question.answer.trim() || null,
        })),
      };
      if (isEdit && test) {
        await api.patch(`/company/technical-tests/${test.id}`, body);
        toast.success(status === 'published' ? 'Prueba actualizada y publicada.' : 'Prueba actualizada.');
      } else {
        await api.post('/company/technical-tests', body);
        toast.success(status === 'published' ? 'Prueba técnica publicada.' : 'Borrador de prueba guardado.');
      }
      navigate('/empresa/pruebas');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos guardar la prueba técnica.');
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && tests.loading) return <PageLoader label="Cargando la prueba técnica…" />;
  if (isEdit && tests.error) return <ErrorState message={tests.error.message} onRetry={tests.reload} />;
  if (isEdit && !tests.loading && !test) {
    return (
      <EmptyState
        icon={ClipboardText}
        title="Prueba técnica no encontrada"
        description="No existe o no pertenece a tu empresa. Vuelve a la lista para elegir una prueba válida."
        action={<Link to="/empresa/pruebas" className={buttonStyles('primary', 'sm')}>Volver a pruebas</Link>}
      />
    );
  }

  const totalQuestions = form.questions.length;

  return (
    <div className="space-y-6">
      <Link to="/empresa/pruebas" className="inline-flex items-center gap-1.5 rounded text-[11.5px] font-medium text-muted transition hover:text-electric focus-ring">
        <ArrowLeft size={14} aria-hidden="true" /> Volver a pruebas técnicas
      </Link>

      <PageHeader
        title={isEdit ? 'Editar prueba técnica' : 'Nueva prueba técnica'}
        description="Define las preguntas, la duración y el puntaje mínimo. Puedes vincular la prueba a una vacante y guardar borradores."
        actions={
          isEdit && test?.status === 'published' ? (
            <Link to="/empresas#pruebas" className={buttonStyles('secondary', 'md')}>
              <ArrowSquareOut size={14} aria-hidden="true" /> Ver portal
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-5">
          <section className="surface p-5 sm:p-6" aria-labelledby="test-info-title">
            <div className="flex items-center gap-2">
              <PencilSimple size={17} className="text-electric" aria-hidden="true" />
              <h2 id="test-info-title" className="text-sm font-semibold text-ink">Datos de la prueba</h2>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label="Título de la prueba" htmlFor="title" required hint="Entre 6 y 140 caracteres.">
                <Input id="title" value={form.title} onChange={(event) => update('title', event.target.value)} maxLength={140} placeholder="Ej. Evaluación de análisis de datos" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Vacante vinculada" htmlFor="vacancy" hint="Opcional. Solo se listan vacantes de tu empresa.">
                  <Select id="vacancy" value={form.vacancyId} onChange={(event) => update('vacancyId', event.target.value)}>
                    <option value="">Sin vacante</option>
                    {vacancyOptions.map((vacancy) => (
                      <option key={vacancy.id} value={vacancy.id}>{vacancy.title}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Estado" htmlFor="status" hint="Solo las publicadas aparecen en el portal.">
                  <Select id="status" value={form.status} onChange={(event) => update('status', event.target.value as TestForm['status'])}>
                    <option value="draft">Borrador</option>
                    <option value="published">Publicada</option>
                    <option value="archived">Archivada</option>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Duración (minutos)" htmlFor="duration" required hint="Entre 5 y 240 minutos.">
                  <Input id="duration" type="number" min={5} max={240} value={form.durationMinutes} onChange={(event) => update('durationMinutes', event.target.value)} />
                </Field>
                <Field label="Puntaje mínimo (%)" htmlFor="passing" required hint="Entre 0 y 100.">
                  <Input id="passing" type="number" min={0} max={100} value={form.passingScore} onChange={(event) => update('passingScore', event.target.value)} />
                </Field>
              </div>
              <Field label="Descripción" htmlFor="description" required hint="Explica qué evalúa la prueba (mínimo 20 caracteres).">
                <Textarea id="description" value={form.description} onChange={(event) => update('description', event.target.value)} maxLength={2500} className="min-h-24" placeholder="Evaluación sobre consultas, interpretación de datos y comunicación de hallazgos." />
              </Field>
              <Field label="Instrucciones" htmlFor="instructions" hint="Opcional. Indica condiciones, herramientas permitidas o criterios de respuesta.">
                <Textarea id="instructions" value={form.instructions} onChange={(event) => update('instructions', event.target.value)} maxLength={3000} className="min-h-24" placeholder="Responde de forma individual. Puedes usar calculadora..." />
              </Field>
            </div>
          </section>

          <section className="surface p-5 sm:p-6" aria-labelledby="questions-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardText size={17} className="text-violet" aria-hidden="true" />
                  <h2 id="questions-title" className="text-sm font-semibold text-ink">Preguntas</h2>
                </div>
                <p className="mt-1 text-[11px] text-muted">{plural(totalQuestions, 'pregunta configurada', 'preguntas configuradas')}. Las respuestas correctas no se muestran en el portal público.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={addQuestion} icon={<Plus size={14} aria-hidden="true" />}>
                Agregar pregunta
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {form.questions.map((question, index) => (
                <article key={index} className="rounded-2xl border border-line bg-paper/35 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Pregunta {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      disabled={form.questions.length === 1}
                      className="rounded-lg p-1.5 text-muted transition hover:bg-rose/10 hover:text-rose focus-ring disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label={`Eliminar pregunta ${index + 1}`}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3">
                    <Field label="Enunciado" htmlFor={`question-${index}`} required>
                      <Textarea
                        id={`question-${index}`}
                        value={question.prompt}
                        onChange={(event) => updateQuestion(index, { prompt: event.target.value })}
                        maxLength={1200}
                        className="min-h-20"
                        placeholder="¿Qué cláusula SQL permite agrupar registros?"
                      />
                    </Field>
                    <Field label="Tipo de respuesta" htmlFor={`question-type-${index}`} required>
                      <Select
                        id={`question-type-${index}`}
                        value={question.type}
                        onChange={(event) => updateQuestion(index, { type: event.target.value as QuestionType })}
                      >
                        <option value="multiple">Opción múltiple</option>
                        <option value="open">Respuesta abierta</option>
                      </Select>
                    </Field>
                    {question.type === 'multiple' ? (
                      <>
                        <Field label="Opciones" htmlFor={`question-options-${index}`} required hint="Una opción por línea. Mínimo dos.">
                          <Textarea
                            id={`question-options-${index}`}
                            value={question.options}
                            onChange={(event) => updateQuestion(index, { options: event.target.value })}
                            className="min-h-24 font-mono text-xs"
                            placeholder={'GROUP BY\nORDER BY\nWHERE\nLIMIT'}
                          />
                        </Field>
                        <Field label="Respuesta correcta" htmlFor={`question-answer-${index}`} hint="Opcional para el borrador, recomendada para calificar.">
                          <Input
                            id={`question-answer-${index}`}
                            value={question.answer}
                            onChange={(event) => updateQuestion(index, { answer: event.target.value })}
                            maxLength={1200}
                            placeholder="GROUP BY"
                          />
                        </Field>
                      </>
                    ) : (
                      <Field label="Respuesta de referencia" htmlFor={`question-answer-${index}`} hint="Opcional. No se muestra en la vista pública.">
                        <Textarea
                          id={`question-answer-${index}`}
                          value={question.answer}
                          onChange={(event) => updateQuestion(index, { answer: event.target.value })}
                          maxLength={1200}
                          className="min-h-20"
                          placeholder="Se espera que la respuesta mencione..."
                        />
                      </Field>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="sticky bottom-3 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-line bg-white/95 p-3 shadow-lift backdrop-blur">
            <Link to="/empresa/pruebas" className={buttonStyles('ghost', 'md')}>Cancelar</Link>
            {form.status !== 'draft' && (
              <Button variant="secondary" onClick={() => save('draft')} loading={saving}>Guardar borrador</Button>
            )}
            <Button onClick={() => save()} loading={saving} icon={<CheckCircle size={15} aria-hidden="true" />}>
              {isEdit ? 'Guardar cambios' : form.status === 'draft' ? 'Guardar borrador' : 'Publicar prueba'}
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="surface p-5" aria-labelledby="test-preview-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="test-preview-title" className="text-sm font-semibold text-ink">Vista previa</h2>
              <Badge tone={form.status === 'published' ? 'emerald' : form.status === 'draft' ? 'amber' : 'slate'}>
                {form.status === 'published' ? 'Publicada' : form.status === 'draft' ? 'Borrador' : 'Archivada'}
              </Badge>
            </div>
            <div className="mt-3 rounded-xl border border-line bg-paper/40 p-4">
              <h3 className="text-base font-semibold leading-snug text-ink">{form.title.trim() || 'Título de la prueba'}</h3>
              <p className="mt-1.5 line-clamp-3 text-[11.5px] leading-relaxed text-muted">
                {form.description.trim() || 'Aquí aparecerá la descripción de la evaluación.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1"><Clock size={10} aria-hidden="true" />{form.durationMinutes || 0} min</span>
                <span className="rounded-full bg-white px-2 py-1">Mínimo {form.passingScore || 0}%</span>
                <span className="rounded-full bg-white px-2 py-1">{plural(totalQuestions, 'pregunta', 'preguntas')}</span>
              </div>
              {form.vacancyId && (
                <p className="mt-3 text-[10px] text-muted">
                  Vinculada a: <span className="font-medium text-ink-soft">{vacancyOptions.find((vacancy) => vacancy.id === form.vacancyId)?.title || 'Vacante'}</span>
                </p>
              )}
            </div>
          </section>

          <section className="surface p-5" aria-labelledby="test-tips-title">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-electric" aria-hidden="true" />
              <h2 id="test-tips-title" className="text-sm font-semibold text-ink">Buenas prácticas</h2>
            </div>
            <ul className="mt-3 space-y-2 text-[11.5px] leading-relaxed text-muted">
              <li>· Evalúa lo que la vacante realmente requiere.</li>
              <li>· Usa preguntas claras y sin ambigüedad.</li>
              <li>· Define un puntaje mínimo razonable.</li>
              <li>· Revisa las respuestas antes de publicar.</li>
            </ul>
            <Link to="/empresa/vacantes" className="mt-4 inline-flex items-center gap-1.5 rounded text-[11px] font-semibold text-electric hover:underline focus-ring">
              <ClipboardText size={13} aria-hidden="true" /> Ir a vacantes
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
