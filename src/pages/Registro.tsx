import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Buildings, GraduationCap, Eye, EyeSlash, UserPlus } from '@phosphor-icons/react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input, Field, Select, Checkbox } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { ApiError, api } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth, homeForRole } from '@/lib/auth';
import { DemoNotice } from '@/components/common/DemoNotice';
import { cn } from '@/lib/cn';
import type { Career } from '@/lib/types';

type RegisterRole = 'student' | 'company';

export default function Registro() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<RegisterRole>(params.get('rol') === 'empresa' ? 'company' : 'student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [careerId, setCareerId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('');
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const careers = useAsyncData(() => api.get<{ items: Career[] }>('/careers'), []);

  useEffect(() => {
    setError('');
  }, [role]);

  const sectors = ['Tecnología', 'Servicios financieros', 'Educación', 'Salud', 'Comercio', 'Industria', 'Consultoría', 'Otro'];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (fullName.trim().length < 3) return setError('Escribe tu nombre completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError('Ingresa un correo electrónico válido.');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return setError('La contraseña debe tener al menos 8 caracteres y combinar letras y números.');
    }
    if (password !== confirm) return setError('Las contraseñas no coinciden.');
    if (!terms) return setError('Debes aceptar las condiciones de uso y el aviso de privacidad.');
    if (role === 'company' && companyName.trim().length < 2) return setError('Escribe el nombre de tu empresa.');
    if (role === 'company' && sector.trim().length < 2) return setError('Selecciona el sector de tu empresa.');

    setLoading(true);
    try {
      const user = await register({
        role,
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        careerId: role === 'student' && careerId ? careerId : null,
        companyName: role === 'company' ? companyName.trim() : undefined,
        sector: role === 'company' ? sector : undefined,
      });
      navigate(homeForRole(user.role), { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No pudimos crear tu cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Elige tu rol y completa lo esencial. Podrás ajustar tu perfil después."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-electric hover:underline">Iniciar sesión</Link>
        </>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-line bg-paper p-1" role="tablist" aria-label="Tipo de cuenta">
        <button
          type="button"
          role="tab"
          aria-selected={role === 'student'}
          onClick={() => setRole('student')}
          className={cn('flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold transition focus-ring', role === 'student' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}
        >
          <GraduationCap size={15} aria-hidden="true" /> Estudiante
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === 'company'}
          onClick={() => setRole('company')}
          className={cn('flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold transition focus-ring', role === 'company' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}
        >
          <Buildings size={15} aria-hidden="true" /> Empresa
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        <Field label={role === 'company' ? 'Nombre del responsable' : 'Nombre completo'} htmlFor="register-name" required>
          <Input id="register-name" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nombre y apellidos" required />
        </Field>

        <Field label="Correo electrónico" htmlFor="register-email" required>
          <Input id="register-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.edu.co" required />
        </Field>

        {role === 'student' ? (
          <Field label="Carrera" htmlFor="register-career" hint="Opcional. Personaliza las recomendaciones de tu panel.">
            <Select id="register-career" value={careerId} onChange={(event) => setCareerId(event.target.value)}>
              <option value="">Selecciona tu carrera</option>
              {(careers.data?.items || []).map((career) => <option key={career.id} value={career.id}>{career.name}</option>)}
            </Select>
          </Field>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre de la empresa" htmlFor="register-company" required>
              <Input id="register-company" autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Ejemplo S.A.S." required />
            </Field>
            <Field label="Sector" htmlFor="register-sector" required>
              <Select id="register-sector" value={sector} onChange={(event) => setSector(event.target.value)} required>
                <option value="">Selecciona un sector</option>
                {sectors.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </Field>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contraseña" htmlFor="register-password" hint="Mínimo 8 caracteres, con letras y números." required>
            <div className="relative">
              <Input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Crea una contraseña"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-ink focus-ring"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Field label="Confirmar contraseña" htmlFor="register-confirm" required>
            <Input id="register-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repite la contraseña" required />
          </Field>
        </div>

        <Checkbox
          label="Acepto las condiciones de uso y el aviso de privacidad"
          description="Entiendo que este es un proyecto de demostración y que el contenido y las empresas son ejemplos."
          checked={terms}
          onChange={(event) => setTerms(event.target.checked)}
        />

        {error && (
          <div className="rounded-xl border border-rose/25 bg-rose/[0.05] px-3.5 py-2.5 text-[12.5px] text-rose" role="alert">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading} icon={<UserPlus size={17} />}>
          Crear cuenta gratis <ArrowRight size={15} />
        </Button>
      </form>

      <div className="mt-5 flex items-start gap-2 rounded-xl border border-electric/15 bg-[#edf3ff] px-3.5 py-2.5 text-[11px] leading-relaxed text-ink-soft">
        <Buildings size={14} className="mt-0.5 shrink-0 text-electric" aria-hidden="true" />
        <p>
          {role === 'company'
            ? 'Al registrarte como empresa se crea un perfil empresarial editable. Podrás publicar retos después de completarlo.'
            : 'Tu cuenta de estudiante es gratuita. No pedimos datos de pago ni ofrecemos tutorías.'}
        </p>
      </div>

      <DemoNotice compact className="mt-3">
        No uses contraseñas ni datos personales reales en este entorno de demostración.
      </DemoNotice>

      <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
        El registro local no exige confirmación por correo. El acceso con Google aún no está configurado.
      </p>
    </AuthLayout>
  );
}
