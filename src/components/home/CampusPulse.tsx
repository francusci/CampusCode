import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle,
  ClipboardText,
  Clock,
  Desktop,
  Laptop,
  Sparkle,
} from '@phosphor-icons/react';
import type { PublicSummary } from '@/lib/types';
import { buttonStyles } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Spinner';

export function CampusPulse({ summary, loading }: { summary: PublicSummary | null; loading: boolean }) {
  const campus = summary?.campus;
  const metrics = [
    {
      label: 'Equipos disponibles',
      value: campus ? `${campus.computersAvailable}/${campus.computersTotal}` : '—',
      icon: Desktop,
      tone: 'bg-emerald/10 text-emerald',
      hint: 'Préstamo de PCs',
    },
    {
      label: 'Préstamos hoy',
      value: campus ? campus.loansToday : '—',
      icon: Clock,
      tone: 'bg-electric/8 text-electric',
      hint: 'Registro del campus',
    },
    {
      label: 'Vacantes activas',
      value: campus ? campus.activeVacancies : '—',
      icon: Briefcase,
      tone: 'bg-violet/10 text-violet',
      hint: 'Portal de empresas',
    },
    {
      label: 'Pruebas técnicas',
      value: campus ? campus.technicalTests : '—',
      icon: ClipboardText,
      tone: 'bg-amber/10 text-amber',
      hint: 'Evaluaciones publicadas',
    },
  ];

  return (
    <div className="relative mx-auto max-w-[36rem]">
      <div className="pointer-events-none absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-electric/10 via-violet/5 to-transparent blur-2xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white p-4 shadow-[0_30px_80px_-36px_rgba(11,27,58,0.5)] sm:p-5">
        <div className="bg-ink-gradient relative overflow-hidden rounded-2xl p-5 text-white sm:p-6">
          <div className="pointer-events-none absolute -right-14 -top-16 size-48 rounded-full border border-white/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-4 top-12 size-28 rounded-full border border-white/10" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#c7d2fe]">
                  <Sparkle size={15} weight="fill" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Campus en vivo</p>
                  <p className="text-sm font-semibold text-white">Universidad Mayor de Cartagena</p>
                </div>
              </div>
            </div>
            <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-white/70">
              Demo
            </span>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-2.5">
            {loading && !summary
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                    <Skeleton className="h-3 w-16 bg-white/15" />
                    <Skeleton className="mt-2 h-6 w-12 bg-white/15" />
                  </div>
                ))
              : metrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-medium text-white/50">{metric.label}</p>
                      <metric.icon size={14} className="text-white/45" aria-hidden="true" />
                    </div>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white">{metric.value}</p>
                    <p className="text-[9px] text-white/35">{metric.hint}</p>
                  </div>
                ))}
          </div>

          <div className="relative mt-4 flex flex-col gap-2 sm:flex-row">
            <Link to="/prestamo-pcs" className={buttonStyles('primary', 'sm', 'flex-1')}>
              <Laptop size={15} aria-hidden="true" />
              Registrar PC
            </Link>
            <Link to="/empresas#vacantes" className={buttonStyles('secondary', 'sm', 'flex-1 border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white')}>
              <Briefcase size={15} aria-hidden="true" />
              Ver vacantes
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 pb-1">
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <Badge tone="amber" dot>Cifras ficticias</Badge>
            <span>Datos de demostración, no estadísticas oficiales.</span>
          </div>
          <Link to="/prestamo-pcs" className="inline-flex items-center gap-1 text-[11px] font-semibold text-electric hover:underline">
            Ver equipos <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="absolute -bottom-4 left-4 hidden items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[10px] font-medium text-ink-soft shadow-md sm:flex">
        <CheckCircle size={13} weight="fill" className="text-emerald" aria-hidden="true" />
        100% web · accesible desde cualquier navegador
      </div>
    </div>
  );
}
