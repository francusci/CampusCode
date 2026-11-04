import { useMemo, useState } from 'react';
import {
  CheckCircle,
  MagnifyingGlass,
  ShieldCheck,
  UserCircle,
  Users,
  X,
  XCircle,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData, useDebouncedValue } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select, inputClass } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { formatDate, relativeTime, roleLabels } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { AdminUser, Role } from '@/lib/types';

export default function AdminUsuarios() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const debouncedQ = useDebouncedValue(q, 320);
  const { data, loading, error, reload } = useAsyncData(
    () => api.get<{ items: AdminUser[] }>('/admin/users', { q: debouncedQ, role }),
    [debouncedQ, role],
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null);

  const users = data?.items || [];
  const summary = useMemo(
    () => ({
      total: users.length,
      active: users.filter((item) => item.isActive).length,
      students: users.filter((item) => item.role === 'student').length,
      companies: users.filter((item) => item.role === 'company').length,
    }),
    [users],
  );

  async function changeRole(target: AdminUser, next: Role) {
    if (next === target.role) return;
    setBusyId(target.id);
    try {
      await api.patch(`/admin/users/${target.id}`, { role: next });
      toast.success(`Rol de ${target.fullName} actualizado a ${roleLabels[next].toLowerCase()}.`);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos cambiar el rol.');
      reload();
    } finally {
      setBusyId(null);
    }
  }

  async function setActive(target: AdminUser, isActive: boolean) {
    setBusyId(target.id);
    try {
      await api.patch(`/admin/users/${target.id}`, { isActive });
      toast.success(isActive ? 'Cuenta activada.' : 'Cuenta desactivada.');
      setDeactivateTarget(null);
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar la cuenta.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoader label="Cargando usuarios…" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Consulta las cuentas registradas, cambia roles y controla el acceso. El servidor impide que elimines tu propio acceso o que quedes sin administradores activos."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de usuarios filtrados">
        <StatCard label="Coincidencias" value={summary.total} hint="Con los filtros actuales" icon={<Users size={18} />} />
        <StatCard label="Activas" value={summary.active} hint="Pueden iniciar sesión" icon={<CheckCircle size={18} />} tone="emerald" />
        <StatCard label="Estudiantes" value={summary.students} hint="Cuentas de estudiante" icon={<UserCircle size={18} />} tone="violet" />
        <StatCard label="Empresas" value={summary.companies} hint="Cuentas empresariales" icon={<ShieldCheck size={18} />} tone="amber" />
      </section>

      <section className="surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar por nombre o correo…"
              aria-label="Buscar usuarios"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
          <Select
            aria-label="Filtrar por rol"
            value={role}
            onChange={(event) => setRole(event.target.value as Role | '')}
            className="sm:w-48"
          >
            <option value="">Todos los roles</option>
            <option value="student">Estudiantes</option>
            <option value="company">Empresas</option>
            <option value="admin">Administradores</option>
          </Select>
          {(q || role) && (
            <Button variant="ghost" size="sm" onClick={() => { setQ(''); setRole(''); }} icon={<X size={13} />}>Limpiar</Button>
          )}
        </div>
      </section>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay usuarios con esos filtros"
          description="Prueba con otro término de búsqueda o cambia el rol seleccionado."
          action={<Button variant="secondary" size="sm" onClick={() => { setQ(''); setRole(''); }}>Quitar filtros</Button>}
        />
      ) : (
        <section className="surface overflow-hidden" aria-label="Listado de usuarios">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-paper/50 text-[9.5px] uppercase tracking-[0.12em] text-muted">
                  <th className="px-4 py-3 font-semibold">Cuenta</th>
                  <th className="px-4 py-3 font-semibold">Contexto</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Último acceso</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => {
                  const isSelf = currentUser?.id === item.id;
                  const busy = busyId === item.id;
                  return (
                    <tr key={item.id} className={cn('border-b border-line/70 last:border-0', !item.isActive && 'bg-paper/35')}>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-electric/8 text-[11px] font-semibold text-electric" aria-hidden="true">
                            {item.fullName.slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold text-ink">
                              {item.fullName}
                              {isSelf && <span className="ml-1.5 rounded bg-electric/10 px-1.5 py-0.5 text-[9px] font-semibold text-electric">Tú</span>}
                            </p>
                            <p className="truncate text-[10.5px] text-muted">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted">
                        <p>{item.companyName || item.careerName || item.headline || 'Sin contexto adicional'}</p>
                        {item.semester && <p className="mt-0.5">Semestre {item.semester}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          aria-label={`Rol de ${item.fullName}`}
                          value={item.role}
                          disabled={busy || isSelf}
                          onChange={(event) => changeRole(item, event.target.value as Role)}
                          className="h-8 w-32 py-0 text-[11.5px]"
                        >
                          <option value="student">Estudiante</option>
                          <option value="company">Empresa</option>
                          <option value="admin">Administrador</option>
                        </Select>
                        {isSelf && <p className="mt-1 text-[9.5px] text-muted">No editable</p>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={item.isActive ? 'emerald' : 'rose'}>{item.isActive ? 'Activa' : 'Inactiva'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[10.5px] text-muted">
                        {item.lastLoginAt ? <span title={formatDate(item.lastLoginAt)}>{relativeTime(item.lastLoginAt)}</span> : 'Nunca'}
                        <p className="mt-0.5 text-[9.5px]">Alta: {formatDate(item.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.isActive ? (
                          <button
                            type="button"
                            disabled={busy || isSelf}
                            onClick={() => setDeactivateTarget(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose/20 px-2 py-1 text-[10.5px] font-semibold text-rose transition hover:bg-rose/5 focus-ring disabled:cursor-not-allowed disabled:opacity-40"
                            title={isSelf ? 'No puedes desactivar tu propia cuenta' : undefined}
                          >
                            <XCircle size={12} aria-hidden="true" /> Desactivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setActive(item, true)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald/20 px-2 py-1 text-[10.5px] font-semibold text-emerald transition hover:bg-emerald/5 focus-ring disabled:opacity-40"
                          >
                            <CheckCircle size={12} aria-hidden="true" /> Activar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="text-[10.5px] leading-relaxed text-muted">
        Al desactivar una cuenta, la persona no puede iniciar sesión ni usar su sesión actual en la siguiente petición autenticada. Los cambios de rol se aplican de inmediato.
      </p>

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => deactivateTarget && setActive(deactivateTarget, false)}
        loading={Boolean(deactivateTarget && busyId === deactivateTarget.id)}
        title="Desactivar cuenta"
        description={`Se bloqueará el acceso de ${deactivateTarget?.fullName || 'esta cuenta'} hasta que vuelvas a activarla. Su historial y contenido se conservan.`}
        confirmLabel="Desactivar"
      />
    </div>
  );
}
