import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BellSimple,
  CheckCircle,
  Gear,
  Key,
  ShieldCheck,
  SignOut,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Field, Input } from '@/components/ui/Field';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { DemoNotice } from '@/components/common/DemoNotice';

export default function Configuracion() {
  const { user, logout, setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  if (!user) return null;

  async function changePassword() {
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return toast.error('La nueva contraseña debe tener al menos 8 caracteres y combinar letras y números.');
    }
    if (newPassword !== confirmPassword) return toast.error('Las contraseñas nuevas no coinciden.');
    setSavingPassword(true);
    try {
      await api.patch('/auth/me/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Contraseña actualizada.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos cambiar la contraseña.');
    } finally {
      setSavingPassword(false);
    }
  }

  async function markNotificationsRead() {
    setMarkingRead(true);
    try {
      await api.post('/auth/me/notifications/read-all');
      toast.success('Todas las notificaciones se marcaron como leídas.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar las notificaciones.');
    } finally {
      setMarkingRead(false);
    }
  }

  async function deactivateAccount() {
    if (!deactivatePassword) return toast.error('Ingresa tu contraseña para confirmar.');
    setDeactivating(true);
    try {
      await api.delete('/auth/me', { password: deactivatePassword });
      setUser(null);
      toast.success('Tu cuenta fue desactivada.');
      navigate('/', { replace: true });
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos desactivar la cuenta.');
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Gestiona tu contraseña, tus notificaciones y el estado de tu cuenta. Ninguna opción de esta página se ejecuta sin validación del servidor."
        actions={<Link to="/perfil" className={buttonStyles('secondary', 'md')}>Editar perfil</Link>}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="surface p-5 sm:p-6" aria-labelledby="seguridad-title">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-electric/8 text-electric"><Key size={18} weight="duotone" aria-hidden="true" /></span>
              <div>
                <h2 id="seguridad-title" className="text-sm font-semibold text-ink">Seguridad de la cuenta</h2>
                <p className="text-[11px] text-muted">Cambia tu contraseña periódicamente y no la reutilices.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3.5">
              <Field label="Contraseña actual" htmlFor="current-password" required>
                <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nueva contraseña" htmlFor="new-password" hint="Mínimo 8 caracteres con letras y números." required>
                  <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                </Field>
                <Field label="Confirmar nueva contraseña" htmlFor="confirm-password" required>
                  <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button onClick={changePassword} loading={savingPassword} icon={<CheckCircle size={15} />} disabled={!currentPassword || !newPassword || !confirmPassword}>Actualizar contraseña</Button>
              </div>
            </div>
          </section>

          <section className="surface p-5 sm:p-6" aria-labelledby="notificaciones-title">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-violet/10 text-violet"><BellSimple size={18} weight="duotone" aria-hidden="true" /></span>
              <div>
                <h2 id="notificaciones-title" className="text-sm font-semibold text-ink">Notificaciones</h2>
                <p className="text-[11px] text-muted">Avisos de postulaciones, entregables y cuenta dentro de la plataforma.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[12px] font-semibold text-ink">Centro de notificaciones</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">Puedes revisar y marcar como leídas todas las notificaciones desde la campana del panel.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={markNotificationsRead} loading={markingRead}>Marcar todas leídas</Button>
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-muted">No enviamos correos ni mensajes fuera de la plataforma en esta demostración. No hay configuración de canales externos.</p>
          </section>

          <section className="surface p-5 sm:p-6" aria-labelledby="sesion-title">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-ink/5 text-ink"><Gear size={18} weight="duotone" aria-hidden="true" /></span>
              <div>
                <h2 id="sesion-title" className="text-sm font-semibold text-ink">Sesión y cuenta</h2>
                <p className="text-[11px] text-muted">Datos de la sesión actual.</p>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-paper p-3"><dt className="text-[10px] uppercase tracking-wider text-muted">Correo</dt><dd className="mt-1 truncate text-[12px] font-medium text-ink">{user.email}</dd></div>
              <div className="rounded-xl border border-line bg-paper p-3"><dt className="text-[10px] uppercase tracking-wider text-muted">Rol</dt><dd className="mt-1 text-[12px] font-medium capitalize text-ink">{user.role === 'student' ? 'Estudiante' : user.role === 'company' ? 'Empresa' : 'Administración'}</dd></div>
            </dl>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" size="sm" onClick={async () => { await logout(); navigate('/'); }} icon={<SignOut size={14} />}>Cerrar sesión</Button>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="surface p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink"><ShieldCheck size={16} className="text-emerald" aria-hidden="true" /> Privacidad</h2>
            <ul className="mt-2.5 space-y-2 text-[11px] leading-relaxed text-muted">
              <li>· La sesión usa una cookie httpOnly; el token no es accesible desde JavaScript.</li>
              <li>· La contraseña se almacena con hash bcrypt.</li>
              <li>· El progreso y las conversaciones son privados.</li>
              <li>· Los datos solo se comparten con una empresa al postularte.</li>
            </ul>
            <Link to="/sobre-nosotros#privacidad" className="mt-3 inline-block text-[11px] font-semibold text-electric hover:underline">Leer el detalle de privacidad</Link>
          </div>

          <div className="rounded-2xl border border-rose/25 bg-rose/[0.035] p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-rose"><WarningCircle size={16} weight="fill" aria-hidden="true" /> Zona de riesgo</h2>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">Desactivar la cuenta impide iniciar sesión. El contenido no se elimina de inmediato en esta demostración y no se puede reactivar sin la administración.</p>
            <Button variant="danger" size="sm" className="mt-3 w-full" onClick={() => setDeactivateOpen(true)} icon={<Trash size={14} />}>Desactivar mi cuenta</Button>
          </div>

          <DemoNotice compact>
            Entorno de demostración. No uses credenciales reales ni datos personales sensibles.
          </DemoNotice>
        </aside>
      </div>

      <Modal
        open={deactivateOpen}
        onClose={() => { setDeactivateOpen(false); setDeactivatePassword(''); }}
        title="Desactivar cuenta"
        description="Esta acción cierra tu sesión e impide nuevos inicios. Confirma con tu contraseña."
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setDeactivateOpen(false); setDeactivatePassword(''); }} disabled={deactivating}>Cancelar</Button>
            <Button variant="danger" size="sm" onClick={deactivateAccount} loading={deactivating}>Desactivar cuenta</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 rounded-xl border border-rose/20 bg-rose/[0.04] p-3">
            <WarningCircle size={18} className="mt-0.5 shrink-0 text-rose" aria-hidden="true" />
            <p className="text-[11.5px] leading-relaxed text-ink-soft">Si eres el último administrador activo, el servidor bloqueará la operación. Las cuentas de demostración pueden quedar desactivadas hasta volver a sembrar la base.</p>
          </div>
          <Field label="Contraseña actual" htmlFor="deactivate-password" required>
            <Input id="deactivate-password" type="password" autoComplete="current-password" value={deactivatePassword} onChange={(event) => setDeactivatePassword(event.target.value)} />
          </Field>
        </div>
      </Modal>

      <div className="flex justify-end">
        <Badge tone="slate">Cuenta: {user.email}</Badge>
      </div>
    </div>
  );
}
