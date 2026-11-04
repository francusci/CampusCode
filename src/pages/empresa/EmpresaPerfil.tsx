import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowSquareOut,
  Buildings,
  CheckCircle,
  Globe,
  LockKey,
  MapPin,
  SealCheck,
  ShieldCheck,
  Sparkle,
  WarningCircle,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { PageLoader } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/States';
import { DemoNotice } from '@/components/common/DemoNotice';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { CompanyProfile } from '@/lib/types';

interface ProfileForm {
  name: string;
  sector: string;
  description: string;
  location: string;
  website: string;
  logoColor: string;
}

const colorOptions = [
  { value: 'blue', label: 'Azul', className: 'bg-[#2563eb]' },
  { value: 'indigo', label: 'Índigo', className: 'bg-[#4f46e5]' },
  { value: 'violet', label: 'Violeta', className: 'bg-[#7c3aed]' },
  { value: 'cyan', label: 'Cian', className: 'bg-[#0891b2]' },
  { value: 'emerald', label: 'Esmeralda', className: 'bg-[#0f9f6e]' },
  { value: 'amber', label: 'Ámbar', className: 'bg-[#b45309]' },
  { value: 'rose', label: 'Rosa', className: 'bg-[#be123c]' },
];

function toForm(company: CompanyProfile): ProfileForm {
  return {
    name: company.name,
    sector: company.sector,
    description: company.description || '',
    location: company.location || '',
    website: company.website || '',
    logoColor: company.logoColor || 'blue',
  };
}

export default function EmpresaPerfil() {
  const toast = useToast();
  const { user, refresh } = useAuth();
  const { data, loading, error, reload } = useAsyncData(() => api.get<{ company: CompanyProfile }>('/company/profile'), []);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!data?.company || initialized.current) return;
    setForm(toForm(data.company));
    initialized.current = true;
  }, [data]);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function saveProfile() {
    if (!form) return;
    if (form.name.trim().length < 2) return toast.error('El nombre de la empresa debe tener al menos 2 caracteres.');
    if (form.sector.trim().length < 2) return toast.error('Indica el sector de la empresa.');
    if (form.website.trim() && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(form.website.trim())) {
      return toast.error('El sitio web debe comenzar por http:// o https:// y ser una URL válida.');
    }
    setSaving(true);
    try {
      await api.patch('/company/profile', {
        name: form.name.trim(),
        sector: form.sector.trim(),
        description: form.description.trim(),
        location: form.location.trim() || null,
        website: form.website.trim() || null,
        logoColor: form.logoColor,
      });
      await refresh();
      toast.success('Perfil empresarial actualizado.');
      reload();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos guardar el perfil.');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (passwordForm.newPassword.length < 8) return toast.error('La nueva contraseña debe tener al menos 8 caracteres.');
    if (!/[A-Za-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
      return toast.error('La nueva contraseña debe combinar letras y números.');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Las contraseñas nuevas no coinciden.');
    setPasswordSaving(true);
    try {
      await api.patch('/auth/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Contraseña actualizada.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos actualizar la contraseña.');
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) return <PageLoader label="Cargando perfil empresarial…" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data || !form) return null;

  const company = data.company;
  const color = colorOptions.find((option) => option.value === form.logoColor) || colorOptions[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perfil empresarial"
        description="La información que ves aquí se muestra a los estudiantes en tus retos y en la página de empresas. Mantén el contexto actualizado."
        actions={
          company.slug && (
            <Link to="/empresas" className="inline-flex items-center gap-1.5 rounded-lg text-[11.5px] font-semibold text-electric hover:underline focus-ring">
              <ArrowSquareOut size={13} aria-hidden="true" /> Ver en el sitio público
            </Link>
          )
        }
      />

      {company.isDemo && (
        <DemoNotice>
          Esta empresa es un ejemplo ficticio para la demostración. Puedes editar sus datos, pero no se considera una organización real verificada.
        </DemoNotice>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="surface p-5 sm:p-6" aria-labelledby="empresa-datos-title">
            <div className="flex items-center gap-2">
              <Buildings size={17} className="text-electric" aria-hidden="true" />
              <h2 id="empresa-datos-title" className="text-sm font-semibold text-ink">Datos de la empresa</h2>
            </div>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre de la empresa" htmlFor="company-name" required>
                  <Input id="company-name" value={form.name} onChange={(event) => update('name', event.target.value)} maxLength={120} />
                </Field>
                <Field label="Sector" htmlFor="company-sector" required hint="Ej. Tecnología, Servicios financieros, Salud, Retail.">
                  <Input id="company-sector" value={form.sector} onChange={(event) => update('sector', event.target.value)} maxLength={80} />
                </Field>
              </div>
              <Field label="Descripción" htmlFor="company-description" hint="Presenta a la empresa y el tipo de problemas que propone (máximo 1500 caracteres).">
                <Textarea
                  id="company-description"
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                  maxLength={1500}
                  className="min-h-32"
                  placeholder="Somos una empresa que..."
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ubicación" htmlFor="company-location" hint="Ciudad o país, opcional.">
                  <Input id="company-location" value={form.location} onChange={(event) => update('location', event.target.value)} maxLength={120} placeholder="Cartagena, Colombia" />
                </Field>
                <Field label="Sitio web" htmlFor="company-website" hint="Incluye https://. Opcional.">
                  <Input id="company-website" type="url" value={form.website} onChange={(event) => update('website', event.target.value)} maxLength={220} placeholder="https://empresa.com" />
                </Field>
              </div>
              <Field label="Color de identidad" htmlFor="company-color" hint="Se usa en la tarjeta de la empresa dentro de la plataforma.">
                <Select id="company-color" value={form.logoColor} onChange={(event) => update('logoColor', event.target.value)}>
                  {colorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => setForm(toForm(company))} disabled={saving}>Descartar cambios</Button>
              <Button onClick={saveProfile} loading={saving} icon={<CheckCircle size={15} aria-hidden="true" />}>Guardar perfil</Button>
            </div>
          </section>

          <section className="surface p-5 sm:p-6" aria-labelledby="seguridad-title">
            <div className="flex items-center gap-2">
              <LockKey size={17} className="text-violet" aria-hidden="true" />
              <h2 id="seguridad-title" className="text-sm font-semibold text-ink">Seguridad de la cuenta</h2>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              Cambia la contraseña de acceso. La sesión actual se mantiene abierta; usa una contraseña única que no reutilices en otros servicios.
            </p>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void changePassword();
              }}
            >
              <Field label="Contraseña actual" htmlFor="current-password" required className="sm:col-span-2">
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                />
              </Field>
              <Field label="Nueva contraseña" htmlFor="new-password" required hint="Mínimo 8 caracteres, con letras y números.">
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                />
              </Field>
              <Field label="Confirmar nueva contraseña" htmlFor="confirm-password" required>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                />
              </Field>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" variant="secondary" loading={passwordSaving} icon={<ShieldCheck size={15} aria-hidden="true" />}>
                  Actualizar contraseña
                </Button>
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="surface overflow-hidden" aria-labelledby="preview-empresa-title">
            <div className="bg-ink-gradient px-5 py-6 text-white">
              <span className={cn('flex size-14 items-center justify-center rounded-2xl text-2xl font-semibold text-white shadow-lift', color.className)} aria-hidden="true">
                {(form.name.trim() || company.name).slice(0, 1).toUpperCase()}
              </span>
              <h2 id="preview-empresa-title" className="mt-3 text-lg font-semibold text-white">{form.name.trim() || company.name}</h2>
              <p className="mt-0.5 text-[11.5px] text-white/60">{form.sector.trim() || 'Sector por definir'}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {company.verified && <Badge tone="navy" className="border-white/15 bg-white/10 text-white"><SealCheck size={11} aria-hidden="true" /> Verificada</Badge>}
                {company.isDemo && <Badge tone="navy" className="border-white/15 bg-white/10 text-white">Demostración</Badge>}
              </div>
            </div>
            <div className="space-y-3 p-5">
              <p className="whitespace-pre-line text-[11.5px] leading-relaxed text-muted">
                {form.description.trim() || 'Agrega una descripción para que los estudiantes conozcan el contexto de tu empresa.'}
              </p>
              <div className="space-y-1.5 border-t border-line pt-3 text-[11px] text-muted">
                {form.location.trim() && <p className="flex items-center gap-1.5"><MapPin size={12} aria-hidden="true" /> {form.location}</p>}
                {form.website.trim() && <p className="flex items-center gap-1.5 break-all"><Globe size={12} aria-hidden="true" /> {form.website}</p>}
                <p className="flex items-center gap-1.5"><Sparkle size={12} aria-hidden="true" /> {company.slug}</p>
              </div>
            </div>
          </section>

          <section className="surface p-5" aria-labelledby="cuenta-title">
            <h2 id="cuenta-title" className="text-sm font-semibold text-ink">Cuenta</h2>
            <dl className="mt-3 space-y-2 text-[11.5px]">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">Correo de acceso</dt>
                <dd className="mt-0.5 break-all font-medium text-ink-soft">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">Rol</dt>
                <dd className="mt-0.5 font-medium text-ink-soft">Empresa</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">Miembro desde</dt>
                <dd className="mt-0.5 font-medium text-ink-soft">{user?.createdAt ? formatDate(user.createdAt) : '—'}</dd>
              </div>
            </dl>
            <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-paper px-3 py-2 text-[10.5px] leading-relaxed text-muted">
              <WarningCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              El correo y la verificación los administra el equipo de CampusCode. La verificación no se edita desde este panel.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
