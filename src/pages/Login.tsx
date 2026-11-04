import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, SignIn, Sparkle } from '@phosphor-icons/react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input, Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useAuth, homeForRole } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { DemoNotice } from '@/components/common/DemoNotice';

const demoAccounts = [
  { role: 'Estudiante', email: 'estudiante@campuscode.co', hint: 'Progreso, favoritos y postulaciones de ejemplo' },
  { role: 'Empresa', email: 'empresa@campuscode.co', hint: 'Retos y postulaciones de la empresa demo' },
  { role: 'Administración', email: 'admin@campuscode.co', hint: 'Usuarios, catálogo y reportes' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      const state = location.state as { from?: string } | null;
      const from = state?.from && state.from.startsWith('/') && !state.from.startsWith('//') ? state.from : null;
      navigate(from || homeForRole(user.role), { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No pudimos iniciar sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Entra a tu panel para continuar con tu práctica, tu progreso y tus retos."
      footer={
        <>
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-electric hover:underline">Crear cuenta gratis</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Correo electrónico" htmlFor="login-email" required>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.edu.co"
            required
            invalid={Boolean(error)}
          />
        </Field>
        <Field label="Contraseña" htmlFor="login-password" required>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tu contraseña"
              className="pr-11"
              required
              invalid={Boolean(error)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-paper hover:text-ink focus-ring"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeSlash size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        {error && (
          <div className="rounded-xl border border-rose/25 bg-rose/[0.05] px-3.5 py-2.5 text-[12.5px] text-rose" role="alert">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading} icon={<SignIn size={17} />}>
          Entrar a mi cuenta
        </Button>
      </form>

      <p className="mt-3 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[10.5px] leading-relaxed text-muted">
        El acceso con Google se habilitará cuando se configure OAuth en el proveedor. En este entorno, usa correo y contraseña.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-paper p-4">
        <div className="flex items-center gap-2">
          <Sparkle size={14} className="text-electric" weight="fill" aria-hidden="true" />
          <h2 className="text-[12px] font-semibold text-ink">Cuentas de demostración</h2>
        </div>
        <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
          Contraseña para las tres: <code className="rounded bg-white px-1 py-0.5 font-mono text-[10px] text-ink-soft">Campus123!</code>. Úsalas para revisar cada rol.
        </p>
        <div className="mt-3 space-y-1.5">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => { setEmail(account.email); setPassword('Campus123!'); setError(''); }}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2 text-left transition hover:border-electric/30 hover:bg-electric/[0.03] focus-ring"
            >
              <span className="min-w-0">
                <span className="block text-[11.5px] font-semibold text-ink">{account.role}</span>
                <span className="block truncate text-[10px] text-muted">{account.email}</span>
              </span>
              <span className="hidden max-w-[42%] text-right text-[9.5px] leading-tight text-muted sm:block">{account.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <DemoNotice compact className="mt-3">
        Datos y cuentas de demostración. No uses información personal real en este entorno.
      </DemoNotice>
    </AuthLayout>
  );
}
