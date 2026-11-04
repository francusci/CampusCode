import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Desktop,
  Laptop,
  NotePencil,
  ShieldCheck,
  Wrench,
} from '@phosphor-icons/react';
import { api, ApiError } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/lib/toast';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { DemoNotice } from '@/components/common/DemoNotice';
import { formatDateTime } from '@/lib/format';
import type {
  Computer,
  ComputerCondition,
  ComputerLoan,
  ComputerStatus,
} from '@/lib/types';
import { cn } from '@/lib/cn';

const conditionLabels: Record<ComputerCondition, string> = {
  excelente: 'Excelente',
  bueno: 'Buen estado',
  con_detalles: 'Con detalles',
  mantenimiento: 'En mantenimiento',
};

const statusMeta: Record<ComputerStatus, { label: string; tone: 'emerald' | 'amber' | 'rose' }> = {
  available: { label: 'Disponible', tone: 'emerald' },
  in_use: { label: 'En uso', tone: 'amber' },
  maintenance: { label: 'Mantenimiento', tone: 'rose' },
};

function localInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default function PrestamoComputadores() {
  const { push } = useToast();
  const computers = useAsyncData(() => api.get<{ items: Computer[]; rooms: string[] }>('/computers'), []);
  const loans = useAsyncData(() => api.get<{ items: ComputerLoan[] }>('/computer-loans'), []);

  const [room, setRoom] = useState('');
  const [equipmentNumber, setEquipmentNumber] = useState('');
  const [entryAt, setEntryAt] = useState(localInputValue());
  const [exitAt, setExitAt] = useState('');
  const [condition, setCondition] = useState<ComputerCondition>('bueno');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [returning, setReturning] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState('all');

  const items = computers.data?.items ?? [];
  const rooms = computers.data?.rooms ?? [];
  const loansList = loans.data?.items ?? [];
  const activeLoans = loansList.filter((loan) => loan.status === 'active');
  const availableCount = items.filter((item) => item.status === 'available').length;
  const inUseCount = items.filter((item) => item.status === 'in_use').length;
  const maintenanceCount = items.filter((item) => item.status === 'maintenance').length;
  const roomItems = roomFilter === 'all' ? items : items.filter((item) => item.room === roomFilter);
  const roomEquipment = items.filter((item) => item.room === room);
  const selectedComputer = roomEquipment.find((item) => item.equipmentNumber === equipmentNumber) ?? null;

  const grouped = useMemo(() => {
    const map = new Map<string, Computer[]>();
    for (const item of roomItems) {
      const list = map.get(item.room) ?? [];
      list.push(item);
      map.set(item.room, list);
    }
    return [...map.entries()];
  }, [roomItems]);

  function selectComputer(computer: Computer) {
    setRoom(computer.room);
    setEquipmentNumber(computer.equipmentNumber);
    setCondition(computer.condition);
    setFormError(null);
    document.getElementById('loan-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleRoomChange(value: string) {
    setRoom(value);
    setEquipmentNumber('');
    const firstAvailable = items.find((item) => item.room === value && item.status === 'available');
    setEquipmentNumber(firstAvailable?.equipmentNumber ?? '');
  }

  function handleEquipmentChange(value: string) {
    setEquipmentNumber(value);
    const computer = roomEquipment.find((item) => item.equipmentNumber === value);
    if (computer) setCondition(computer.condition);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!room || !equipmentNumber) {
      setFormError('Selecciona la sala y el número de equipo.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const response = await api.post<{ message: string }>('/computer-loans', {
        room,
        equipmentNumber,
        entryAt,
        exitAt: exitAt || undefined,
        condition,
        notes: notes || undefined,
      });
      push(response.message || 'Préstamo registrado.', 'success');
      setExitAt('');
      setNotes('');
      setEntryAt(localInputValue());
      const next = items.find((item) => item.room === room && item.status === 'available' && item.equipmentNumber !== equipmentNumber);
      setEquipmentNumber(next?.equipmentNumber ?? '');
      computers.reload();
      loans.reload();
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'No pudimos registrar el préstamo.');
    } finally {
      setSaving(false);
    }
  }

  async function registerReturn(loan: ComputerLoan) {
    setReturning(loan.id);
    try {
      const response = await api.patch<{ message: string }>(`/computer-loans/${loan.id}/return`, {
        exitAt: localInputValue(),
        condition: loan.condition,
      });
      push(response.message || 'Salida registrada.', 'success');
      computers.reload();
      loans.reload();
    } catch (caught) {
      push(caught instanceof ApiError ? caught.message : 'No pudimos registrar la salida.', 'error');
    } finally {
      setReturning(null);
    }
  }

  if (computers.loading && !computers.data) {
    return (
      <div className="container-page py-16">
        <PageLoader label="Cargando equipos del campus…" />
      </div>
    );
  }

  return (
    <div className="container-page py-10 pb-16 sm:py-14">
      <PageHeader
        title="Registro de PCs"
        description="Consulta los equipos disponibles, registra un préstamo con sala, número, horario y estado, y cierra la salida cuando termines."
        breadcrumb={[{ label: 'Inicio', to: '/' }, { label: 'Préstamo de computadores' }]}
        actions={
          <>
            <Link to="/catalogo" className={buttonStyles('secondary', 'md')}>
              Ir al catálogo
            </Link>
            <a href="#loan-form" className={buttonStyles('primary', 'md')}>
              <Laptop size={16} aria-hidden="true" />
              Registrar préstamo
            </a>
          </>
        }
      />

      <DemoNotice className="mt-6">
        <strong className="font-semibold">Equipos y préstamos de demostración.</strong> La lista, los horarios y los
        estados son datos ficticios para probar el flujo. No representan inventario real de la universidad.
      </DemoNotice>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Equipos registrados" value={items.length} icon={<Desktop size={22} weight="duotone" />} hint="Salas de demostración" />
        <StatCard label="Disponibles" value={availableCount} icon={<CheckCircle size={22} weight="duotone" />} tone="emerald" hint="Listos para préstamo" />
        <StatCard label="En uso" value={inUseCount} icon={<Clock size={22} weight="duotone" />} tone="amber" hint="Con préstamo activo" />
        <StatCard label="Mantenimiento" value={maintenanceCount} icon={<Wrench size={22} weight="duotone" />} tone="violet" hint="No disponibles" />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.45fr_1fr]">
        <section aria-labelledby="equipment-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="equipment-title" className="text-xl font-semibold tracking-[-0.03em] text-ink">Equipos del campus</h2>
              <p className="mt-1 text-sm text-muted">Selecciona un equipo disponible para completar el formulario.</p>
            </div>
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar por sala">
              <button
                type="button"
                onClick={() => setRoomFilter('all')}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-ring',
                  roomFilter === 'all' ? 'border-electric bg-electric text-white' : 'border-line bg-white text-ink-soft hover:border-line-strong',
                )}
                role="tab"
                aria-selected={roomFilter === 'all'}
              >
                Todas
              </button>
              {rooms.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRoomFilter(item)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-ring',
                    roomFilter === item ? 'border-electric bg-electric text-white' : 'border-line bg-white text-ink-soft hover:border-line-strong',
                  )}
                  role="tab"
                  aria-selected={roomFilter === item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {computers.error ? (
            <div className="mt-5"><ErrorState message="No pudimos cargar los equipos." onRetry={computers.reload} /></div>
          ) : grouped.length === 0 ? (
            <div className="mt-5">
              <EmptyState icon={Desktop} title="No hay equipos en esta sala" description="Prueba con otra sala o vuelve a cargar la lista." />
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {grouped.map(([roomName, equipment]) => (
                <div key={roomName}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-ink">{roomName}</h3>
                    <span className="text-xs text-muted">{equipment.length} equipos</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {equipment.map((computer) => {
                      const meta = statusMeta[computer.status];
                      return (
                        <article key={computer.id} className="surface flex flex-col gap-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className={cn(
                                'flex size-10 items-center justify-center rounded-xl',
                                computer.status === 'available' ? 'bg-emerald/10 text-emerald' : computer.status === 'in_use' ? 'bg-amber/10 text-amber' : 'bg-rose/10 text-rose',
                              )}>
                                <Desktop size={19} weight="duotone" aria-hidden="true" />
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-ink">{computer.room} · {computer.equipmentNumber}</p>
                                <p className="text-xs text-muted">{conditionLabels[computer.condition]}</p>
                              </div>
                            </div>
                            <Badge tone={meta.tone} dot>{meta.label}</Badge>
                          </div>
                          <p className="line-clamp-2 text-xs leading-relaxed text-muted">{computer.notes || 'Equipo de práctica del campus.'}</p>
                          <div className="mt-auto flex items-center justify-between gap-2">
                            <span className="text-[11px] text-muted">Dato de demostración</span>
                            <Button
                              size="sm"
                              variant={computer.status === 'available' ? 'primary' : 'secondary'}
                              disabled={computer.status !== 'available'}
                              onClick={() => selectComputer(computer)}
                            >
                              {computer.status === 'available' ? 'Prestar' : 'No disponible'}
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside id="loan-form" className="scroll-mt-24">
          <div className="surface p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-electric/8 text-electric">
                <NotePencil size={21} weight="duotone" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">Formulario de préstamo</h2>
                <p className="text-xs text-muted">El registro queda asociado a tu cuenta.</p>
              </div>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <Field label="Sala" htmlFor="loan-room" required>
                <Select id="loan-room" value={room} onChange={(event) => handleRoomChange(event.target.value)} required>
                  <option value="">Selecciona una sala</option>
                  {rooms.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Número de equipo"
                htmlFor="loan-equipment"
                required
                hint={room ? `${roomEquipment.filter((item) => item.status === 'available').length} equipos disponibles en esta sala.` : 'Selecciona primero una sala.'}
              >
                <Select
                  id="loan-equipment"
                  value={equipmentNumber}
                  onChange={(event) => handleEquipmentChange(event.target.value)}
                  disabled={!room}
                  required
                >
                  <option value="">Selecciona el equipo</option>
                  {roomEquipment.map((item) => (
                    <option key={item.id} value={item.equipmentNumber} disabled={item.status !== 'available'}>
                      {item.equipmentNumber} · {statusMeta[item.status].label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hora de entrada" htmlFor="loan-entry" required>
                  <Input id="loan-entry" type="datetime-local" value={entryAt} onChange={(event) => setEntryAt(event.target.value)} required />
                </Field>
                <Field label="Hora de salida" htmlFor="loan-exit" hint="Opcional. Si la dejas vacía, el préstamo queda activo.">
                  <Input id="loan-exit" type="datetime-local" value={exitAt} min={entryAt} onChange={(event) => setExitAt(event.target.value)} />
                </Field>
              </div>
              <Field label="Estado del PC" htmlFor="loan-condition" required hint={selectedComputer ? 'Estado reportado al momento del préstamo.' : undefined}>
                <Select id="loan-condition" value={condition} onChange={(event) => setCondition(event.target.value as ComputerCondition)} required>
                  {Object.entries(conditionLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Observaciones" htmlFor="loan-notes" hint="Opcional. Describe un detalle del equipo o del uso.">
                <Textarea id="loan-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} placeholder="Ej. Teclado con desgaste leve, equipo usado para práctica de bases de datos…" />
              </Field>
              {formError && (
                <p className="rounded-xl border border-rose/20 bg-rose/5 px-3 py-2 text-sm text-rose" role="alert">{formError}</p>
              )}
              <Button type="submit" className="w-full" loading={saving}>
                <Laptop size={17} aria-hidden="true" />
                Registrar préstamo
              </Button>
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald" aria-hidden="true" />
                El horario y el estado se guardan en el servidor. Puedes consultar y cerrar tus préstamos desde cualquier navegador.
              </p>
            </form>
          </div>
        </aside>
      </div>

      <section className="mt-10" aria-labelledby="loan-history-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="loan-history-title" className="text-xl font-semibold tracking-[-0.03em] text-ink">Mis préstamos</h2>
            <p className="mt-1 text-sm text-muted">Historial de equipos registrados por tu cuenta.</p>
          </div>
          <Badge tone={activeLoans.length ? 'amber' : 'emerald'} dot>
            {activeLoans.length ? `${activeLoans.length} activo${activeLoans.length === 1 ? '' : 's'}` : 'Sin préstamos activos'}
          </Badge>
        </div>

        <div className="mt-4">
          {loans.loading ? (
            <PageLoader label="Cargando préstamos…" />
          ) : loans.error ? (
            <ErrorState message="No pudimos cargar tus préstamos." onRetry={loans.reload} />
          ) : loansList.length === 0 ? (
            <EmptyState
              icon={Laptop}
              title="Todavía no tienes préstamos"
              description="Cuando registres un equipo, aparecerá aquí con su horario y estado."
              action={<a href="#loan-form" className={buttonStyles('primary', 'sm')}>Registrar el primero <ArrowRight size={14} aria-hidden="true" /></a>}
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {loansList.map((loan) => (
                <article key={loan.id} className="surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        'flex size-10 items-center justify-center rounded-xl',
                        loan.status === 'active' ? 'bg-amber/10 text-amber' : 'bg-emerald/10 text-emerald',
                      )}>
                        <Laptop size={19} weight="duotone" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{loan.room} · {loan.equipmentNumber}</p>
                        <p className="text-xs text-muted">{conditionLabels[loan.condition]}</p>
                      </div>
                    </div>
                    <Badge tone={loan.status === 'active' ? 'amber' : 'emerald'} dot>
                      {loan.status === 'active' ? 'Activo' : 'Cerrado'}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 rounded-xl bg-paper/70 p-3 text-xs text-muted sm:grid-cols-2">
                    <span><strong className="font-semibold text-ink-soft">Entrada:</strong> {formatDateTime(loan.entryAt)}</span>
                    <span><strong className="font-semibold text-ink-soft">Salida:</strong> {loan.exitAt ? formatDateTime(loan.exitAt) : 'Pendiente'}</span>
                  </div>
                  {loan.notes && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{loan.notes}</p>}
                  {loan.status === 'active' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-3"
                      loading={returning === loan.id}
                      onClick={() => registerReturn(loan)}
                    >
                      <Clock size={14} aria-hidden="true" />
                      Registrar salida ahora
                    </Button>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
