import { Plus } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

export function Accordion({ items }: { items: Array<{ title: string; content: ReactNode }> }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
      {items.map((item, index) => (
        <details key={item.title} className="group" open={index === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 transition hover:bg-paper/70 sm:px-7 [&::-webkit-details-marker]:hidden">
            <span className="text-left text-[15px] font-semibold text-ink">{item.title}</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-white text-muted transition group-open:rotate-45 group-open:border-electric/30 group-open:bg-electric/8 group-open:text-electric">
              <Plus size={15} aria-hidden="true" />
            </span>
          </summary>
          <div className="px-5 pb-6 text-sm leading-relaxed text-muted sm:px-7 sm:pr-16">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
