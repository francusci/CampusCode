import { useState } from 'react';
import { CheckCircle, Code, Robot, Sparkle, XCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

const options = [
  { id: 'a', label: '4' },
  { id: 'b', label: '10' },
  { id: 'c', label: '15' },
  { id: 'd', label: '14' },
];

export function HeroPreview() {
  const [selected, setSelected] = useState<string | null>(null);
  const correct = selected === 'b';

  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:max-w-none">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(70%_70%_at_50%_40%,rgba(37,99,235,0.16),transparent_70%)] blur-xl" aria-hidden="true" />
      <div className="bg-grid absolute -right-4 -top-8 -z-10 size-40 rounded-3xl opacity-60" aria-hidden="true" />

      <div className="relative overflow-hidden rounded-[1.6rem] border border-line-strong/80 bg-white shadow-[0_40px_80px_-36px_rgba(11,27,58,0.45)]">
        <div className="flex items-center justify-between border-b border-line bg-[#fbfcfe] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#ffb4b4]" />
            <span className="size-2 rounded-full bg-[#ffd58f]" />
            <span className="size-2 rounded-full bg-[#9fe3c3]" />
            <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Práctica · Programación I</span>
          </div>
          <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted">Vista de ejemplo</span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold text-emerald">Básico</span>
            <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-medium text-muted">Bucles</span>
          </div>
          <h2 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-ink">¿Cuál es el valor final de suma?</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-[#1b2f50] bg-[#08152a]">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-white/40">
              <Code size={13} aria-hidden="true" /> Python
            </div>
            <pre className="overflow-x-auto p-3.5 text-[12.5px] leading-relaxed text-[#dce7ff]">
              <code>{`suma = 0
for i in range(1, 5):
    suma += i`}</code>
            </pre>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {options.map((option) => {
              const isSelected = selected === option.id;
              const isCorrectOption = option.id === 'b';
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelected(option.id)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-medium transition focus-ring',
                    isSelected && correct && isCorrectOption && 'border-emerald/40 bg-emerald/8 text-emerald',
                    isSelected && !correct && 'border-rose/40 bg-rose/6 text-rose',
                    !isSelected && 'border-line bg-white text-ink-soft hover:border-electric/30 hover:bg-electric/[0.035]',
                  )}
                  aria-pressed={isSelected}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase text-muted">{option.id}</span>
                    {option.label}
                  </span>
                  {isSelected && (isCorrectOption ? <CheckCircle size={16} weight="fill" /> : <XCircle size={16} weight="fill" />)}
                </button>
              );
            })}
          </div>
          <div className="mt-3 min-h-[2.25rem] rounded-lg bg-paper px-3 py-2 text-[11.5px] leading-relaxed text-muted" aria-live="polite">
            {selected
              ? correct
                ? 'Correcto. range(1, 5) genera 1, 2, 3 y 4; la suma es 10.'
                : 'Aún no. Recuerda que el límite superior de range no se incluye.'
              : 'Selecciona una opción para probar la interacción.'}
          </div>
        </div>
      </div>

      <div className="absolute -left-4 bottom-16 hidden w-[230px] rounded-2xl border border-line bg-white/95 p-3.5 shadow-lift backdrop-blur lg:block">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-violet/10 text-violet">
            <Robot size={17} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink">Asistente académico</p>
            <p className="text-[9px] text-muted">Explicación paso a paso</p>
          </div>
        </div>
        <p className="mt-2.5 rounded-lg bg-paper p-2 text-[10.5px] leading-relaxed text-ink-soft">
          “Antes de sumar, revisa qué valores produce realmente <span className="font-mono">range(1, 5)</span>.”
        </p>
      </div>

      <div className="absolute -right-3 top-20 hidden items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 shadow-lift xl:flex">
        <Sparkle size={15} weight="fill" className="text-amber" aria-hidden="true" />
        <div>
          <p className="text-[10px] font-semibold text-ink">Progreso de ejemplo</p>
          <p className="text-[9px] text-muted">2 de 4 ejercicios</p>
        </div>
        <span className="ml-1 flex size-7 items-center justify-center rounded-full bg-emerald/10 text-[10px] font-bold text-emerald">50%</span>
      </div>
    </div>
  );
}
