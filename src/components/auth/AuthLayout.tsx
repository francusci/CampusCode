import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ShieldCheck, Sparkle } from '@phosphor-icons/react';
import { Logo } from '@/components/ui/Logo';
import type { ReactNode } from 'react';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-[100dvh] bg-white lg:grid-cols-[1.02fr_0.98fr]">
      <aside className="relative hidden overflow-hidden bg-ink-gradient p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_85%_10%,rgba(37,99,235,0.34),transparent_70%),radial-gradient(50%_50%_at_0%_100%,rgba(124,58,237,0.24),transparent_70%)]" aria-hidden="true" />
        <div className="relative">
          <Logo variant="light" size="md" />
          <div className="mt-20 max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-[#c7d2fe]">
              <Sparkle size={13} weight="fill" aria-hidden="true" /> Plataforma académica
            </span>
            <h2 className="mt-5 text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.045em] text-white">
              Practica, comprende y demuestra lo que sabes.
            </h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/60">
              Un solo lugar para ejercicios, explicaciones, progreso y retos de empresas. Sin tutorías y sin atajos.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                'Banco de ejercicios con pista y procedimiento.',
                'Asistente académico con estado de IA transparente.',
                'Progreso calculado con tu actividad real.',
                'Retos con entregables y seguimiento.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-white/70">
                  <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-[#a5b4fc]" aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative mt-12 flex items-center gap-2 text-[10.5px] text-white/45">
          <ShieldCheck size={14} aria-hidden="true" />
          Proyecto de demostración · Datos ficticios identificados
        </div>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 lg:border-0 lg:px-10 lg:py-6">
          <div className="lg:hidden"><Logo size="sm" /></div>
          <Link to="/" className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-muted transition hover:text-ink focus-ring">
            <ArrowLeft size={13} aria-hidden="true" /> Volver al inicio
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
            <div className="mt-7">{children}</div>
            <div className="mt-7 border-t border-line pt-5 text-center text-[12px] text-muted">{footer}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
