import { useEffect, useState } from 'react';
import { CheckCircle, LinkedinLogo, LinkSimple, UserCircle } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input, Select, Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { DemoNotice } from '@/components/common/DemoNotice';
import { roleLabels } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Career, User } from '@/lib/types';

const colors = [
  { value: 'blue', label: 'Azul' },
  { value: 'indigo', label: 'Índigo' },
  { value: 'violet', label: 'Violeta' },
  { value: 'cyan', label: 'Cian' },
  { value: 'emerald', label: 'Esmeralda' },
  { value: 'amber', label: 'Ámbar' },
  { value: 'rose', label: 'Rosa' },
  { value: 'slate', label: 'Gris' },
];

export default function Perfil() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const careers = useAsyncData(() => api.get<{ items: Career[] }>('/careers'), []);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    headline: user?.profile.headline || '',
    bio: user?.profile.bio || '',
    careerId: user?.profile.careerId || '',
    semester: user?.profile.semester ? String(user.profile.semester) : '',
    website: user?.profile.website || '',
    linkedin: user?.profile.linkedin || '',
    avatarColor: user?.profile.avatarColor || 'blue',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      fullName: user.fullName,
      headline: user.profile.headline || '',
      bio: user.profile.bio || '',
      careerId: user.profile.careerId || '',
      semester: user.profile.semester ? String(user.profile.semester) : '',
      website: user.profile.website || '',
      linkedin: user.profile.linkedin || '',
      avatarColor: user.profile.avatarColor || 'blue',
    });
  }, [user]);

  if (!user) return <PageLoader />;

  const selectedCareer = careers.data?.items.find((career) => career.id === form.careerId);

  async function save() {
    if (form.fullName.trim().length < 3) return toast.error('Escribe tu nombre completo.');
    const semester = form.semester ? Number(form.semester) : null;
    if (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > 12)) return toast.error('El semestre debe estar entre 1 y 12.');
    setSaving(true);
    try {
      const response = await api.patch<{ user: User }>('/auth/me/profile', {
        fullName: form.fullName.trim(),
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        careerId: form.careerId || null,
        semester,
        website: form.website.trim() || null,
        linkedin: form.linkedin.trim() || null,
        avatarColor: form.avatarColor,
      });
      setUser(response.user);
      toast.success('Perfil actualizado.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'No pudimos guardar tu perfil.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi perfil"
        description="Completa tu información académica. Estos datos se comparten con una empresa solo cuando te postulas a uno de sus retos."
        actions={<Badge tone="slate">{roleLabels[user.role]}</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="surface p-5 sm:p-6" aria-labelledby="datos-title">
          <h2 id="datos-title" className="text-sm font-semibold text-ink">Datos personales y académicos</h2>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">El correo y el rol no se editan desde aquí. El correo identifica tu cuenta.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo" htmlFor="profile-name" required>
              <Input id="profile-name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} maxLength={100} autoComplete="name" />
            </Field>
            <Field label="Correo electrónico" htmlFor="profile-email">
              <Input id="profile-email" value={user.email} readOnly disabled />
            </Field>
            <Field label="Titular" htmlFor="profile-headline" hint="Una frase breve sobre lo que estudias o te interesa." className="sm:col-span-2">
              <Input id="profile-headline" value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} maxLength={140} placeholder="Ejemplo: Estudiante de Ingeniería Informática interesada en datos." />
            </Field>
            <Field label="Carrera" htmlFor="profile-career">
              <Select id="profile-career" value={form.careerId} onChange={(event) => setForm({ ...form, careerId: event.target.value })}>
                <option value="">Sin carrera seleccionada</option>
                {(careers.data?.items || []).map((career) => <option key={career.id} value={career.id}>{career.name}</option>)}
              </Select>
            </Field>
            <Field label="Semestre" htmlFor="profile-semester" hint="Entre 1 y 12.">
              <Input id="profile-semester" type="number" min={1} max={12} value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })} />
            </Field>
            <Field label="Sitio web" htmlFor="profile-website" hint="Debe comenzar por http:// o https://.">
              <Input id="profile-website" type="url" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="https://tu-portafolio.com" />
            </Field>
            <Field label="LinkedIn" htmlFor="profile-linkedin" hint="Enlace completo a tu perfil.">
              <Input id="profile-linkedin" type="url" value={form.linkedin} onChange={(event) => setForm({ ...form, linkedin: event.target.value })} placeholder="https://www.linkedin.com/in/…" />
            </Field>
            <Field label="Sobre mí" htmlFor="profile-bio" hint="Cuéntale a una empresa cómo trabajas y qué quieres aprender." className="sm:col-span-2">
              <textarea
                id="profile-bio"
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                rows={5}
                maxLength={1200}
                className="w-full rounded-xl border border-line-strong bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted/70 focus:border-electric focus:outline-none focus:ring-4 focus:ring-electric/10"
                placeholder="Ejemplo: Me interesa el desarrollo backend y la analítica de datos. He trabajado en proyectos académicos con Python y SQL."
              />
            </Field>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <p className="text-[13px] font-semibold text-ink">Color del avatar</p>
            <p className="mt-0.5 text-[10.5px] text-muted">Se usa para identificarte en el panel y en las postulaciones. No es una foto.</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setForm({ ...form, avatarColor: color.value })}
                  aria-pressed={form.avatarColor === color.value}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10.5px] transition focus-ring',
                    form.avatarColor === color.value ? 'border-electric bg-electric/[0.04] text-electric' : 'border-line text-muted hover:border-line-strong',
                  )}
                >
                  <Avatar name={form.fullName || 'CC'} color={color.value} size="xs" />
                  {color.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-[10.5px] text-muted">Los cambios se guardan en tu cuenta y se reflejan en el panel.</p>
            <Button onClick={save} loading={saving} icon={<CheckCircle size={15} />}>Guardar cambios</Button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="surface overflow-hidden">
            <div className="h-20 bg-ink-gradient" aria-hidden="true" />
            <div className="-mt-8 px-5 pb-5">
              <Avatar name={form.fullName || user.fullName} color={form.avatarColor} size="xl" className="border-4 border-white shadow-sm" />
              <h2 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-ink">{form.fullName || 'Tu nombre'}</h2>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{form.headline || 'Agrega un titular para presentarte.'}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Badge tone="blue">{selectedCareer?.name || 'Sin carrera'}</Badge>
                {form.semester && <Badge tone="slate">Semestre {form.semester}</Badge>}
              </div>
              <p className="mt-3 whitespace-pre-line text-[11.5px] leading-relaxed text-ink-soft">{form.bio || 'Tu descripción aparecerá aquí.'}</p>
              <div className="mt-3 space-y-1.5">
                {form.website && <a href={form.website} target="_blank" rel="noreferrer noopener" className="flex items-center gap-1.5 text-[11px] text-electric hover:underline"><LinkSimple size={12} aria-hidden="true" /> {form.website.replace(/^https?:\/\//, '')}</a>}
                {form.linkedin && <a href={form.linkedin} target="_blank" rel="noreferrer noopener" className="flex items-center gap-1.5 text-[11px] text-electric hover:underline"><LinkedinLogo size={12} aria-hidden="true" /> LinkedIn</a>}
              </div>
            </div>
          </div>

          <div className="surface p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink"><UserCircle size={16} className="text-electric" aria-hidden="true" /> Quién ve tu perfil</h2>
            <ul className="mt-2.5 space-y-2 text-[11px] leading-relaxed text-muted">
              <li>· La administración puede ver los datos de la cuenta.</li>
              <li>· Una empresa ve tu perfil solo si te postulas a su reto.</li>
              <li>· Tu progreso y tus conversaciones no se comparten con empresas.</li>
              <li>· Puedes desactivar tu cuenta desde Configuración.</li>
            </ul>
          </div>

          <DemoNotice compact>
            Perfil de demostración. No incluyas datos personales sensibles.
          </DemoNotice>
        </aside>
      </div>
    </div>
  );
}
