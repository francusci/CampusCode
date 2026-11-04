import { ArrowRight, Copy, PaperPlaneTilt, Sparkle } from '@phosphor-icons/react';

export function AiPreview({ configured }: { configured: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-lift">
      <div className="flex items-center justify-between border-b border-line bg-[#fbfcfe] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-violet/10 text-violet">
            <Sparkle size={14} weight="fill" aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold text-ink">Asistente CampusCode</span>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${configured ? 'border-emerald/20 bg-emerald/8 text-emerald' : 'border-amber/20 bg-amber/8 text-amber'}`}>
          {configured ? 'IA conectada' : 'Guía local'}
        </span>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-electric px-3.5 py-2.5 text-[12px] leading-relaxed text-white">
          ¿Por qué mi función recursiva no termina?
        </div>
        <div className="max-w-[92%]">
          <div className="rounded-2xl rounded-bl-md border border-line bg-paper px-3.5 py-3 text-[11.5px] leading-relaxed text-ink-soft">
            <p className="font-semibold text-ink">Revisa dos cosas en este orden:</p>
            <ol className="mt-1.5 list-decimal space-y-1 pl-4">
              <li>Que exista un caso base alcanzable.</li>
              <li>Que cada llamada reduzca la entrada.</li>
            </ol>
            <pre className="mt-2.5 overflow-x-auto rounded-lg bg-[#08152a] p-2.5 text-[10px] leading-relaxed text-[#dce7ff]">{`if n == 0:\n    return 1\nreturn n * factorial(n - 1)`}</pre>
            <p className="mt-2">Si `n` nunca llega a 0, la pila de llamadas crece hasta fallar.</p>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[9px] text-muted">
            <button type="button" className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-paper focus-ring" aria-label="Copiar respuesta de ejemplo">
              <Copy size={11} aria-hidden="true" /> Copiar
            </button>
            <span>Ejemplo de conversación</span>
          </div>
        </div>
      </div>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
          <span className="flex-1 text-[11px] text-muted">Pregunta sobre tu materia…</span>
          <span className="flex size-7 items-center justify-center rounded-lg bg-electric text-white">
            <PaperPlaneTilt size={13} weight="fill" aria-hidden="true" />
          </span>
        </div>
      </div>
      <div className="absolute -right-2 -top-2 hidden size-20 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.14),transparent_70%)] lg:block" aria-hidden="true" />
      <ArrowRight size={14} className="absolute -left-7 top-1/2 hidden text-line-strong lg:block" aria-hidden="true" />
    </div>
  );
}
