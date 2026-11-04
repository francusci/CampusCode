import { ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { ProgressBar } from '@/components/ui/ProgressBar';

const subjects = [
  { name: 'Programación I', percent: 78, tone: 'blue' as const },
  { name: 'Bases de Datos', percent: 56, tone: 'violet' as const },
  { name: 'Cálculo Diferencial', percent: 34, tone: 'emerald' as const },
];

const days = [28, 45, 32, 62, 48, 76, 58, 82, 70, 88, 74, 92, 80, 96];

export function SampleProgress() {
  return (
    <div className="relative">
      <div className="surface overflow-hidden p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">Tu evolución</h3>
              <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted">Ejemplo</span>
            </div>
            <p className="mt-1 text-[11px] text-muted">Actividad de los últimos 14 días</p>
          </div>
          <span className="rounded-lg bg-emerald/10 px-2 py-1 text-[10px] font-semibold text-emerald">+24%</span>
        </div>

        <div className="mt-6 flex h-32 items-end gap-1.5 sm:gap-2">
          {days.map((height, index) => (
            <div key={index} className="group relative flex-1 rounded-t-md bg-gradient-to-t from-electric/15 to-electric/55 transition hover:from-electric/25 hover:to-electric/80" style={{ height: `${height}%` }}>
              <span className="sr-only">Día {index + 1}: actividad de ejemplo</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-wider text-muted/70">
          <span>Hace 2 semanas</span>
          <span>Hoy</span>
        </div>

        <div className="mt-6 space-y-4 border-t border-line pt-5">
          {subjects.map((subject) => (
            <div key={subject.name}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-soft">{subject.name}</span>
                <span className="font-mono text-[10px] text-muted">{subject.percent}%</span>
              </div>
              <ProgressBar value={subject.percent} tone={subject.tone} size="sm" label={`Progreso de ejemplo en ${subject.name}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-5 -right-3 hidden items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 shadow-lift sm:flex">
        <span className="flex size-7 items-center justify-center rounded-full bg-emerald/10 text-emerald">
          <CheckCircle size={16} weight="fill" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-semibold text-ink">Objetivo alcanzado</p>
          <p className="text-[9px] text-muted">8 ejercicios completados</p>
        </div>
        <ArrowRight size={12} className="text-muted" aria-hidden="true" />
      </div>
    </div>
  );
}
